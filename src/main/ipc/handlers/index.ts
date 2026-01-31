import { ipcMain, dialog, shell } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import { setupGitHandlers } from './git';
import { setupRepositoryHandlers } from './repository';
import { setupNetworkHandlers } from './network';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function setupIpcHandlers(): void {
  setupGitHandlers();
  setupRepositoryHandlers();
  setupNetworkHandlers();

  // App version
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return process.env.npm_package_version || '0.1.0';
  });

  // App quit
  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    const { app } = require('electron');
    app.quit();
  });

  // Select folder
  ipcMain.handle(IPC_CHANNELS.APP_SELECT_FOLDER, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Git Repository',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'No folder selected' };
      }

      const folderPath = result.filePaths[0];
      const folderName = path.basename(folderPath);

      // Check if it's a git repository
      const gitDir = path.join(folderPath, '.git');
      if (!fs.existsSync(gitDir)) {
        return { 
          success: false, 
          error: 'Selected folder is not a git repository' 
        };
      }

      return {
        success: true,
        data: {
          path: folderPath,
          name: folderName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Open path in file explorer
  ipcMain.handle(IPC_CHANNELS.APP_OPEN_PATH, async (_, folderPath: string) => {
    try {
      const result = await shell.openPath(folderPath);
      if (result) {
        return {
          success: false,
          error: result,
        };
      }
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open path',
      };
    }
  });

  // Open terminal at path
  ipcMain.handle(IPC_CHANNELS.APP_OPEN_TERMINAL, async (_, folderPath: string) => {
    try {
      // Determine the platform and open appropriate terminal
      const platform = process.platform;
      
      if (platform === 'win32') {
        // Windows - open PowerShell
        await execAsync(`start powershell -NoExit -Command "cd '${folderPath}'"`);
      } else if (platform === 'darwin') {
        // macOS - open Terminal
        await execAsync(`open -a Terminal "${folderPath}"`);
      } else {
        // Linux - try common terminal emulators
        try {
          await execAsync(`gnome-terminal --working-directory="${folderPath}"`);
        } catch {
          try {
            await execAsync(`xterm -e "cd '${folderPath}' && $SHELL"`);
          } catch {
            return {
              success: false,
              error: 'No terminal emulator found',
            };
          }
        }
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open terminal',
      };
    }
  });
}

