import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface AppData {
  name: string
  icon?: string
  size: number
  paths: string[]
  selected: boolean
}

export interface UserFolder {
  name: string
  path: string
  size: number
  selected: boolean
}

export class ScannerService {
  constructor() {}

  public async scanSystem(): Promise<{ apps: AppData[], folders: UserFolder[] }> {
    const platform = os.platform()
    const apps = platform === 'darwin' ? await this.scanMacApps() : await this.scanWindowsApps()
    const folders = await this.scanUserFolders()
    
    return { apps, folders }
  }

  private async scanUserFolders(): Promise<UserFolder[]> {
    const homeDir = os.homedir()
    const foldersToScan = [
      'Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos'
    ]

    const results: UserFolder[] = []

    for (const folder of foldersToScan) {
      const folderPath = path.join(homeDir, folder)
      try {
        const stats = await fs.stat(folderPath)
        if (stats.isDirectory()) {
          const size = await this.calculateDirSize(folderPath)
          results.push({
            name: folder,
            path: folderPath,
            size,
            selected: true
          })
        }
      } catch (err) {
        // Folder might not exist
      }
    }
    return results
  }

  private async scanMacApps(): Promise<AppData[]> {
    const appDirs = ['/Applications', path.join(os.homedir(), 'Applications')]
    const apps: AppData[] = []

    for (const dir of appDirs) {
      try {
        const items = await fs.readdir(dir)
        for (const item of items) {
          if (item.endsWith('.app')) {
            const appPath = path.join(dir, item)
            // Simplified logic: In a real app, we'd find related Library files
            // For now, we just count the .app bundle size
            const size = await this.calculateDirSize(appPath)
            
            apps.push({
              name: item.replace('.app', ''),
              paths: [appPath],
              size,
              selected: false
            })
          }
        }
      } catch (err) {
        console.error(`Error scanning ${dir}:`, err)
      }
    }
    return apps
  }

  private async scanWindowsApps(): Promise<AppData[]> {
    // Windows scanning is complex. For MVP, we can scan Program Files
    // But typically we can't move "Program Files".
    // We should focus on AppData for Windows.
    // Logic: List folders in AppData/Roaming and AppData/Local
    
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    
    const apps: AppData[] = []
    
    // Helper to scan a directory and assume each folder is an "App" data container
    const scanDir = async (base: string, type: string) => {
        try {
            const items = await fs.readdir(base)
            for (const item of items) {
                const itemPath = path.join(base, item)
                const stats = await fs.stat(itemPath)
                if (stats.isDirectory()) {
                     const size = await this.calculateDirSize(itemPath)
                     if (size > 1024 * 1024) { // Only show > 1MB
                         apps.push({
                             name: `${item} (${type})`,
                             paths: [itemPath],
                             size,
                             selected: false
                         })
                     }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    await scanDir(appData, 'Roaming')
    await scanDir(localAppData, 'Local')

    return apps
  }

  private async calculateDirSize(dirPath: string): Promise<number> {
    let size = 0
    try {
      const files = await fs.readdir(dirPath)
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        if (stats.isDirectory()) {
          size += await this.calculateDirSize(filePath)
        } else {
          size += stats.size
        }
      }
    } catch (error) {
      // Ignore access errors
    }
    return size
  }
}
