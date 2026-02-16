import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/constants'

// Custom APIs for renderer
const api = {
  getAppVersion: (): string => ipcRenderer.sendSync(IPC_CHANNELS.GET_APP_VERSION),
  startScan: (): void => ipcRenderer.send(IPC_CHANNELS.START_Scan),
  startServer: (): void => ipcRenderer.send(IPC_CHANNELS.START_SERVER),
  connectToServer: (ip: string): void => ipcRenderer.send(IPC_CHANNELS.CONNECT_TO_SERVER, ip),
  getSystemData: (): Promise<any> => ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_DATA),
  startBackup: (apps: any[], folders: any[]): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.START_BACKUP, { apps, folders }),
  sendFile: (filePath: string): void => ipcRenderer.send(IPC_CHANNELS.SEND_FILE, filePath),
  onScanResults: (callback: (data: any) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.SCAN_RESULTS, (_, data) => callback(data))
  },
  onTransferProgress: (callback: (data: any) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.TRANSFER_PROGRESS, (_, data) => callback(data))
  },
  onLogMessage: (callback: (msg: string) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.LOG_MESSAGE, (_, msg) => callback(msg))
  } 
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.electron = electronAPI
  // @ts-ignore (define in d.ts)
  window.api = api
}
