import net from 'net'
import { app, BrowserWindow } from 'electron'
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
  private state: ReceiveState = ReceiveState.READING_HEADER_LEN
  private buffer: Buffer = Buffer.alloc(0)
  private currentHeader: FileHeader | null = null
  private writeStream: fs.WriteStream | null = null
  private bytesReceivedForFile = 0
  private restoreRoot: string
  
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
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Sender connected (Restoring to Downloads/DataRestoreWiz_Restore)')
      
      socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk])
        this.processBuffer()
      })

      socket.on('end', () => {
        console.log('Client disconnected')
        this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Sender disconnected')
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
  }

  private processBuffer() {
      while (true) {
          if (this.state === ReceiveState.READING_HEADER_LEN) {
              if (this.buffer.length >= 4) {
                  const len = this.buffer.readUInt32BE(0)
                  this.buffer = this.buffer.subarray(4)
                  this.state = ReceiveState.READING_HEADER
                  this.currentHeader = null as any // Will be set next
                  // Store expected length in a temp property or just know it's "len"
                  // Actually, let's just stick "len" into a property or use a minimal parser
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
                      if (headerData.type === 'SESSION_START') {
                          this.sessionTotalFiles = headerData.totalFiles
                          this.sessionTotalBytes = headerData.totalBytes
                          this.sessionFilesProcessed = 0
                          this.sessionBytesProcessed = 0
                          this.state = ReceiveState.READING_HEADER_LEN
                          this.emitProgress()
                          continue
                      }

                      this.currentHeader = headerData as FileHeader
                      console.log(`Receiving: ${this.currentHeader.viewPath} (${this.currentHeader.size} bytes)`)
                      
                      const targetPath = path.join(this.restoreRoot, this.currentHeader.viewPath)
                      const targetDir = path.dirname(targetPath)
                      
                      if (!fs.existsSync(targetDir)) {
                          fs.mkdirSync(targetDir, { recursive: true })
                      }
                      
                      this.writeStream = fs.createWriteStream(targetPath)
                      this.bytesReceivedForFile = 0
                      this.state = ReceiveState.READING_FILE
                  } catch (e) {
                      console.error('Header parse error', e)
                      this.state = ReceiveState.READING_HEADER_LEN // Reset?
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
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Restored: ${this.currentHeader?.viewPath}`)
      this.emitProgress()
  }

  private emitProgress() {
      const status: TransferStatus = {
          currentFile: this.currentHeader?.viewPath || 'Initializing...',
          totalFiles: this.sessionTotalFiles,
          filesProcessed: this.sessionFilesProcessed,
          totalBytes: this.sessionTotalBytes,
          bytesProcessed: this.sessionBytesProcessed,
          speed: 0 // Not calculating speed for now
      }
      this.window?.webContents.send(IPC_CHANNELS.TRANSFER_PROGRESS, status)
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`)
    })
  }

  public stop() {
    this.server.close()
  }
}
