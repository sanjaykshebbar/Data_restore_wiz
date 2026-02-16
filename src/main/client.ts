import net from 'net'
import { BrowserWindow } from 'electron'

export class BackupClient {
  private socket: net.Socket | null = null
  private window: BrowserWindow | null = null

  constructor(window: BrowserWindow) {
    this.window = window
  }

  public connect(ip: string, port: number = 1234) {
    this.socket = new net.Socket()
    
    this.socket.connect(port, ip, () => {
      console.log('Connected to server')
      // Send handshake
    })

    this.socket.on('data', (data) => {
       console.log('Received from server:', data.toString())
    })

    this.socket.on('close', () => {
      console.log('Connection closed')
    })
    
    this.socket.on('error', (err) => {
      console.error('Client error:', err)
    })
  }

  public sendFile(path: string) {
    if (!this.socket) return
    // TODO: implement file sending logic
  }
}
