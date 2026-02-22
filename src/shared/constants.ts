export const IPC_CHANNELS = {
  GET_APP_VERSION: 'get-app-version',
  START_Scan: 'start-scan',
  START_SERVER: 'start-server',
  CONNECT_TO_SERVER: 'connect-to-server',
  SEND_FILE: 'send-file',
  SCAN_RESULTS: 'scan-results',
  TRANSFER_PROGRESS: 'transfer-progress',
  LOG_MESSAGE: 'log-message',
  GET_SYSTEM_DATA: 'get-system-data',
  START_BACKUP: 'start-backup',
  CONNECTION_SUCCESS: 'connection-success',
  GET_MACHINE_INFO: 'get-machine-info',
  SESSION_START: 'session-start',
};

export interface FileHeader {
  viewPath: string; // Relative path for display/restore
  originalPath: string;
  size: number;
  type: 'file' | 'directory';
}

export interface BackupItem {
    name: string;
    path: string;
    size: number;
    selected: boolean;
}

export interface TransferStatus {
  currentFile: string;
  totalFiles: number;
  filesProcessed: number;
  totalBytes: number;
  bytesProcessed: number;
  speed: number; // bytes per second
}

export interface MachineInfo {
  hostname: string;
  username: string;
  userType: 'Admin' | 'Standard';
  ipAddress: string;
  os: string;
  osVersion: string;
}
