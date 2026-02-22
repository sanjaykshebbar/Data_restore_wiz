import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { IPC_CHANNELS } from '../shared/constants'
import { DiscoveryService } from './discovery'
import { BackupServer } from './server'
import { BackupClient } from './client'
import { ScannerService } from './scanner'
import { MachineInfoService } from './MachineInfoService'

let mainWindow: BrowserWindow
const discovery = new DiscoveryService()
const scanner = new ScannerService()
const machineInfo = new MachineInfoService()
let server: BackupServer | null = null
let client: BackupClient | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Handlers
  ipcMain.on(IPC_CHANNELS.GET_APP_VERSION, (event) => {
    event.returnValue = app.getVersion()
  })

  ipcMain.on(IPC_CHANNELS.START_SERVER, () => {
    if (!server) {
      server = new BackupServer(mainWindow)
      server.start()
      discovery.publish(1234)
    }
  })

  ipcMain.on(IPC_CHANNELS.START_Scan, () => {
    discovery.startDiscovery(mainWindow)
  })

  ipcMain.on(IPC_CHANNELS.CONNECT_TO_SERVER, (_, ip) => {
    if (!client) {
      client = new BackupClient(mainWindow)
    }
    client.connect(ip, 1234)
  })

  ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_DATA, async () => {
    console.log('Scanning system data...')
    try {
      const data = await scanner.scanSystem()
      return data
    } catch (err) {
      console.error('Scan error:', err)
      return { apps: [], folders: [] }
    }
  })

  ipcMain.handle(IPC_CHANNELS.START_BACKUP, async (_event, { apps, folders }) => {
     if (client) {
         if (client.backingUp) {
             console.log('Main: Backup already in progress, ignoring.')
             return
         }
         await client.startBackup(apps, folders)
     }
  })

  ipcMain.handle(IPC_CHANNELS.GET_MACHINE_INFO, async () => {
    return machineInfo.getMachineInfo()
  })

  ipcMain.handle(IPC_CHANNELS.GET_MACHINE_INFO, async () => {
    return machineInfo.getMachineInfo()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
  app.on('before-quit', () => {
    discovery.stop()
    if (server) server.stop()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
