// import Bonjour, { Service } from 'bonjour-service'
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'
import os from 'os'

// Try to require the module to inspect it
const BonjourModule = require('bonjour-service')
console.log('Bonjour Module:', BonjourModule)

// Handle different export types (default vs named)
const Bonjour = BonjourModule.default || BonjourModule.Bonjour || BonjourModule

export class DiscoveryService {
  private bonjour: any // Bonjour
  private service: any // Service | null = null
  private browser: any = null

  constructor() {
    try {
      console.log('Initializing DiscoveryService...')
      this.bonjour = new Bonjour()
      console.log('Bonjour instance created:', this.bonjour)
    } catch (error) {
      console.error('Failed to initialize Bonjour:', error)
    }
  }

  public publish(port: number) {
    if (!this.bonjour) {
      console.error('Bonjour not initialized, skipping publish')
      return
    }
    const name = `Backup-${os.hostname()}`
    console.log(`Publishing service: ${name} on port ${port}`)
    
    try {
      this.service = this.bonjour.publish({
        name: name,
        type: 'backup-wiz',
        port: port,
        txt: {
          os: os.platform(),
          hostname: os.hostname()
        }
      })

      this.service.on('error', (error) => {
        console.error('Bonjour Service Error:', error)
      })
    } catch (err) {
      console.error('Error publishing service:', err)
    }
  }

  public startDiscovery(mainWindow: Electron.BrowserWindow) {
    if (!this.bonjour) {
      console.error('Bonjour not initialized, skipping discovery')
      return
    }
    console.log('Starting discovery...')
    try {
      this.browser = this.bonjour.find({ type: 'backup-wiz' }, (service) => {
        console.log('Found service:', service)
        // Filter out self if needed, or handle in UI
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_RESULTS, service)
      })
    } catch (err) {
      console.error('Error starting discovery:', err)
    }
  }

  public stop() {
    if (this.service) {
      this.service.stop()
      this.service = null
    }
    if (this.browser) {
      this.browser.stop()
      this.browser = null
    }
  }
}
