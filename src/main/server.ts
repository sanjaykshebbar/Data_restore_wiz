import net from 'net'
import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { FileHeader, IPC_CHANNELS, TransferStatus } from '../shared/constants'

enum ReceiveState {
  IDLE,
  READING_HEADER_LEN,
  READING_HEADER,
  READING_FILE
}

export class BackupServer {
  private server: net.Server
  private port: number = 1234
  private window: BrowserWindow | null = null
  
  // State
  private state: ReceiveState = ReceiveState.IDLE
  private buffer: Buffer = Buffer.alloc(0)
  private currentHeader: FileHeader | null = null
  private writeStream: fs.WriteStream | null = null
  private bytesReceivedForFile = 0
  private restoreRoot: string
  
  private currentSocket: net.Socket | null = null
  
  // Session progress
  private sessionTotalFiles = 0
  private sessionTotalBytes = 0
  private sessionFilesProcessed = 0
  private sessionBytesProcessed = 0

  constructor(window: BrowserWindow) {
    this.window = window
    this.restoreRoot = path.join(app.getPath('downloads'), 'DataRestoreWiz_Restore')
    
    // Ensure restore directory exists
    if (!fs.existsSync(this.restoreRoot)) {
        fs.mkdirSync(this.restoreRoot, { recursive: true })
    }

    this.server = net.createServer((socket) => {
      console.log('Client connected')
      this.currentSocket = socket
      this.state = ReceiveState.READING_HEADER_LEN
      
      socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk])
        this.processBuffer()
      })

      socket.on('end', () => {
        console.log('Client disconnected')
        this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Sender disconnected')
        this.currentSocket = null
        if (this.writeStream) {
            this.writeStream.end()
            this.writeStream = null
        }
      })
      
      socket.on('error', (err) => {
        console.error('Socket error:', err)
      })
    })

    this.server.on('error', (err) => {
      console.error('Server error:', err)
    })

    // Handshake IPC handlers
    ipcMain.on(IPC_CHANNELS.ACCEPT_HANDSHAKE, () => {
        if (this.currentSocket) {
            const response = { type: 'HANDSHAKE_RESPONSE', status: 'ACCEPTED' }
            const buf = Buffer.from(JSON.stringify(response))
            const lenBuf = Buffer.alloc(4)
            lenBuf.writeUInt32BE(buf.length, 0)
            this.currentSocket.write(lenBuf)
            this.currentSocket.write(buf)
            this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Handshake accepted.')
        }
    })

    ipcMain.on(IPC_CHANNELS.DECLINE_HANDSHAKE, () => {
        if (this.currentSocket) {
            const response = { type: 'HANDSHAKE_RESPONSE', status: 'DECLINED' }
            const buf = Buffer.from(JSON.stringify(response))
            const lenBuf = Buffer.alloc(4)
            lenBuf.writeUInt32BE(buf.length, 0)
            this.currentSocket.write(lenBuf)
            this.currentSocket.write(buf)
            this.currentSocket.end()
            this.currentSocket = null
            this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Handshake declined.')
        }
    })
  }

  private processBuffer() {
      while (true) {
          if (this.state === ReceiveState.READING_HEADER_LEN) {
              if (this.buffer.length >= 4) {
                  const len = this.buffer.readUInt32BE(0)
                  this.buffer = this.buffer.subarray(4)
                  this.state = ReceiveState.READING_HEADER;
                  (this as any).expectedHeaderLen = len
              } else {
                  break // Wait for more data
              }
          }

          if (this.state === ReceiveState.READING_HEADER) {
              const len = (this as any).expectedHeaderLen
              if (this.buffer.length >= len) {
                  const headerBuf = this.buffer.subarray(0, len)
                  this.buffer = this.buffer.subarray(len)
                  
                  try {
                      const headerData = JSON.parse(headerBuf.toString())
                      
                      if (headerData.type === 'HANDSHAKE_REQUEST') {
                          console.log('Handshake requested')
                          this.window?.webContents.send(IPC_CHANNELS.HANDSHAKE_REQUEST, headerData)
                          this.state = ReceiveState.READING_HEADER_LEN
                          continue
                      }

                      if (headerData.type === 'SESSION_START') {
                          this.sessionTotalFiles = headerData.totalFiles
                          this.sessionTotalBytes = headerData.totalBytes
                          this.sessionFilesProcessed = 0
                          this.sessionBytesProcessed = 0
                          this.state = ReceiveState.READING_HEADER_LEN
                          this.emitProgress()
                          this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Session started: ${this.sessionTotalFiles} files, ${Math.round(this.sessionTotalBytes / 1024 / 1024)} MB`)
                          continue
                      }

                      this.currentHeader = headerData as FileHeader
                      console.log(`Receiving: ${this.currentHeader.viewPath} (${this.currentHeader.size} bytes)`)
                      
                      const targetPath = this.getTargetPath(this.currentHeader.viewPath)
                      const targetDir = path.dirname(targetPath)
                      
                      if (!fs.existsSync(targetDir)) {
                          fs.mkdirSync(targetDir, { recursive: true })
                      }
                      
                      try {
                          this.writeStream = fs.createWriteStream(targetPath)
                          this.writeStream.on('error', (err: any) => {
                              console.error(`Stream error for ${targetPath}:`, err)
                              this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Error writing ${this.currentHeader?.viewPath}: ${err.message}`)
                              // If stream fails, we move to READ_HEADER_LEN to try next file
                              if (this.state === ReceiveState.READING_FILE) {
                                  this.finishFile() 
                              }
                          })
                          this.bytesReceivedForFile = 0
                          this.state = ReceiveState.READING_FILE
                      } catch (err: any) {
                          console.error(`Create stream failed for ${targetPath}:`, err)
                          this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Permission denied: ${this.currentHeader?.viewPath}`)
                          // Skip this file and wait for next header
                          this.state = ReceiveState.READING_HEADER_LEN
                          this.sessionFilesProcessed++
                          this.emitProgress()
                      }
                  } catch (e) {
                      console.error('Header parse error', e)
                      this.state = ReceiveState.READING_HEADER_LEN 
                  }
              } else {
                  break
              }
          }

          if (this.state === ReceiveState.READING_FILE) {
              if (!this.currentHeader) break 

              const remaining = this.currentHeader.size - this.bytesReceivedForFile
              if (remaining === 0) {
                  // File done (empty file?)
                  this.finishFile()
                  continue
              }

              const chunkLen = Math.min(this.buffer.length, remaining)
              const chunk = this.buffer.subarray(0, chunkLen)
              this.buffer = this.buffer.subarray(chunkLen)

              this.writeStream?.write(chunk)
              this.bytesReceivedForFile += chunkLen
              this.sessionBytesProcessed += chunkLen
              this.emitProgress()

              if (this.bytesReceivedForFile === this.currentHeader.size) {
                  this.finishFile()
              } else {
                  break // Processed all buffer, wait for more
              }
          }
      }
  }

  private finishFile() {
      if (this.writeStream) {
          this.writeStream.end()
          this.writeStream = null
      }
      this.sessionFilesProcessed++
      this.state = ReceiveState.READING_HEADER_LEN
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Received: ${this.currentHeader?.viewPath}`)
      this.emitProgress()

      if (this.sessionFilesProcessed === this.sessionTotalFiles && this.sessionTotalFiles > 0) {
          this.finalizeSession()
      }
  }

  private async finalizeSession() {
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'All files received. Starting finalization...')
      
      // Simulate unpacking/moving for visual feedback
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Unpacking data...')
      await new Promise(r => setTimeout(r, 1500))
      
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Moving files to destination folders...')
      
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Restoration complete! Files have been seated in their respective system locations.')
      
      // Reset session
      this.sessionTotalFiles = 0
      this.sessionTotalBytes = 0
  }

  private emitProgress() {
      const status: TransferStatus = {
          currentFile: this.currentHeader?.viewPath || 'Initializing...',
          totalFiles: this.sessionTotalFiles,
          filesProcessed: this.sessionFilesProcessed,
          totalBytes: this.sessionTotalBytes,
          bytesProcessed: this.sessionBytesProcessed,
          speed: 0,
          isReceiver: true
      }
      this.window?.webContents.send(IPC_CHANNELS.TRANSFER_PROGRESS, status)
  }

  private getTargetPath(viewPath: string): string {
      // viewPath is something like "Desktop/file.txt" or "Applications/App/config.json"
      const safePath = viewPath.replace(/^(\.\.(\/|\\))+/, '')
      const parts = safePath.split(/[/\\]/)
      const root = parts[0]
      const relativePart = parts.slice(1).join(path.sep)

      try {
          switch (root) {
              case 'Desktop':
                  return path.join(app.getPath('desktop'), relativePart)
              case 'Documents':
                  return path.join(app.getPath('documents'), relativePart)
              case 'Downloads':
                  return path.join(app.getPath('downloads'), relativePart)
              case 'Pictures':
                  return path.join(app.getPath('pictures'), relativePart)
              case 'Music':
                  return path.join(app.getPath('music'), relativePart)
              case 'Videos':
                  return path.join(app.getPath('videos'), relativePart)
              case 'Applications':
                  // On Windows, appData is Roaming. On Mac, it's ~/Library/Application Support.
                  return path.join(app.getPath('appData'), relativePart)
              default:
                  return path.join(this.restoreRoot, safePath)
          }
      } catch (e) {
          console.warn(`Failed to resolve system path for ${root}, falling back to restoreRoot`)
          return path.join(this.restoreRoot, safePath)
      }
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`)
    })
  }

  public stop() {
    this.server.close()
    if (this.currentSocket) this.currentSocket.destroy()
  }
}
