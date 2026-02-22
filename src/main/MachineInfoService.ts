import os from 'os'
import { exec } from 'child_process'
import { MachineInfo } from '../shared/constants'
import { promisify } from 'util'

const execPromise = promisify(exec)

export class MachineInfoService {
  public async getMachineInfo(): Promise<MachineInfo> {
    const hostname = os.hostname()
    const username = os.userInfo().username
    const osType = os.type() // e.g., 'Windows_NT'
    const osVersion = os.release()
    
    // IP Address
    const interfaces = os.networkInterfaces()
    let ipAddress = '127.0.0.1'
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipAddress = iface.address
          break
        }
      }
      if (ipAddress !== '127.0.0.1') break
    }

    // User Type (Admin vs Standard)
    let userType: 'Admin' | 'Standard' = 'Standard'
    if (os.platform() === 'win32') {
      try {
        // 'whoami /groups' contains 'S-1-5-32-544' (Administrators group) if admin
        const { stdout } = await execPromise('whoami /groups')
        if (stdout.includes('S-1-5-32-544')) {
          userType = 'Admin'
        }
      } catch (e) {
        console.error('Error checking user type:', e)
      }
    } else {
      // For MacOS/Linux
      userType = process.getuid && process.getuid() === 0 ? 'Admin' : 'Standard'
    }

    return {
      hostname,
      username,
      userType,
      ipAddress,
      os: osType,
      osVersion
    }
  }
}
