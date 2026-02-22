import net from 'net'
import { BrowserWindow } from 'electron'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { FileHeader, IPC_CHANNELS, TransferStatus } from '../shared/constants'

export class BackupClient {
  private socket: net.Socket | null = null
  private window: BrowserWindow | null = null
  private totalBytes = 0
  private bytesProcessed = 0
  private filesProcessed = 0
  private totalFiles = 0
  private startTime = 0

  constructor(window: BrowserWindow) {
    this.window = window
  }

  public connect(ip: string, port: number = 1234) {
    this.socket = new net.Socket()
    
    this.socket.connect(port, ip, () => {
      console.log('Connected to server')
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Connected to receiver at ${ip}`)
      this.window?.webContents.send(IPC_CHANNELS.CONNECTION_SUCCESS)
    })

    this.socket.on('data', (data) => {
       console.log('Received from server:', data.toString())
    })

    this.socket.on('close', () => {
      console.log('Connection closed')
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Connection closed')
    })
    
    this.socket.on('error', (err) => {
      console.error('Client error:', err)
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, `Error: ${err.message}`)
    })
  }

  public async startBackup(appData: any[], folders: any[]) {
      if (!this.socket) {
          console.error('No connection')
          return
      }

      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Starting backup process...')
      
      const fileList: { original: string, relative: string }[] = []
      this.totalBytes = 0
      
      // 1. Flatten file list and calculate total size
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Calculating total size...')
      
      const processItem = async (itemPath: string, rootPath: string, rootName: string) => {
        try {
            const stats = await fsPromises.stat(itemPath)
            if (stats.isDirectory()) {
                const children = await fsPromises.readdir(itemPath)
                for (const child of children) {
                    await processItem(path.join(itemPath, child), rootPath, rootName)
                }
            } else {
                const relative = path.join(rootName, path.relative(rootPath, itemPath))
                fileList.push({ original: itemPath, relative })
                this.totalBytes += stats.size
            }
        } catch (e) {
            console.error(`Skipping ${itemPath}:`, e)
        }
      }

      for (const app of appData) {
          if (app.selected) {
               for (const p of app.paths) {
                   await processItem(p, path.dirname(p), 'Applications')
               }
          }
      }

      for (const folder of folders) {
          if (folder.selected) {
              await processItem(folder.path, folder.path, folder.name)
          }
      }

      this.totalFiles = fileList.length
      this.filesProcessed = 0
      this.bytesProcessed = 0
      this.startTime = Date.now()

      console.log(`Found ${this.totalFiles} files, ${this.totalBytes} bytes`)
      
      // 2. Send files sequentially
      for (const file of fileList) {
          await this.sendFile(file.original, file.relative)
          this.filesProcessed++
      }

      console.log('Backup complete')
      this.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, 'Backup completed successfully!')
  }

  private async sendFile(filePath: string, relativePath: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.socket) return reject('No socket')

          fs.stat(filePath, (err, stats) => {
              if (err) return resolve() // Skip error files
              
              const header: FileHeader = {
                  viewPath: relativePath,
                  originalPath: filePath, // Only useful for debug, receiver ignores
                  size: stats.size,
                  type: 'file'
              }

              const headerBuffer = Buffer.from(JSON.stringify(header))
              const lenBuffer = Buffer.alloc(4)
              lenBuffer.writeUInt32BE(headerBuffer.length, 0)

              // Write Header Length + Header
              this.socket!.write(lenBuffer)
              this.socket!.write(headerBuffer)

              // Pipe file
              const stream = fs.createReadStream(filePath)
              
              stream.on('data', (chunk) => {
                  this.socket?.write(chunk)
                  this.bytesProcessed += chunk.length
                  this.emitProgress(relativePath)
              })

              stream.on('end', () => {
                  resolve()
              })
              
              stream.on('error', (e) => {
                  console.error(e)
                  resolve()
              })
          })
      })
  }

  private emitProgress(currentFile: string) {
      const elapsed = (Date.now() - this.startTime) / 1000
      const speed = elapsed > 0 ? this.bytesProcessed / elapsed : 0
      
      const status: TransferStatus = {
          currentFile,
          totalFiles: this.totalFiles,
          filesProcessed: this.filesProcessed,
          totalBytes: this.totalBytes,
          bytesProcessed: this.bytesProcessed,
          speed
      }
      
      this.window?.webContents.send(IPC_CHANNELS.TRANSFER_PROGRESS, status)
  }
}
