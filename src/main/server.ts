import net from 'net'
import { app, BrowserWindow } from 'electron'

export class BackupServer {
  private server: net.Server
  private port: number = 1234
  private window: BrowserWindow | null = null

  constructor(window: BrowserWindow) {
    this.window = window
    this.server = net.createServer((socket) => {
      console.log('Client connected')
      
      socket.on('data', (data) => {
        // TODO: Handle handshake and file data
        console.log('Received data:', data.length)
      })

      socket.on('end', () => {
        console.log('Client disconnected')
      })
      
      socket.on('error', (err) => {
        console.error('Socket error:', err)
      })
    })

    this.server.on('error', (err) => {
      console.error('Server error:', err)
    })
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
