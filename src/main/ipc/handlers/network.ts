import { ipcMain, net } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import type { ConnectionStatus, Result } from '../../../shared/types/git';

let isOnline = true;
let checkInterval: NodeJS.Timeout | null = null;

function checkConnection(): boolean {
  // Simple check - try to reach a common DNS
  try {
    const request = net.request('https://www.google.com');
    request.on('response', () => {
      if (!isOnline) {
        isOnline = true;
        notifyStatusChange();
      }
    });
    request.on('error', () => {
      if (isOnline) {
        isOnline = false;
        notifyStatusChange();
      }
    });
    request.end();
    return isOnline;
  } catch {
    return false;
  }
}

function notifyStatusChange(): void {
  // This would send to all windows
  const { BrowserWindow } = require('electron');
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window: typeof BrowserWindow.prototype) => {
    window.webContents.send(IPC_CHANNELS.NETWORK_STATUS_CHANGED, {
      isOnline,
      lastChecked: new Date(),
    });
  });
}

export function setupNetworkHandlers(): void {
  // Start monitoring network status
  checkInterval = setInterval(() => {
    checkConnection();
  }, 5000); // Check every 5 seconds

  ipcMain.handle(IPC_CHANNELS.NETWORK_CHECK_STATUS, async (): Promise<Result<ConnectionStatus>> => {
    try {
      return {
        success: true,
        data: {
          isOnline,
          lastChecked: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to check network status'),
      };
    }
  });
}

// Cleanup on app quit
process.on('exit', () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
