import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppVersion: () => string
      startScan: () => void
      startServer: () => void
      connectToServer: (ip: string) => void
      getSystemData: () => Promise<{ apps: any[], folders: any[] }>
      startBackup: (apps: any[], folders: any[]) => Promise<void>
      sendFile: (filePath: string) => void
      onScanResults: (callback: (data: any) => void) => void
      onTransferProgress: (callback: (data: any) => void) => void
      onLogMessage: (callback: (msg: string) => void) => void
    }
  }
}
