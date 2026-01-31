import { ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import type { AutomationScript, AutomationExecution } from '../../../shared/types/automation';
import type { Result } from '../../../shared/types/git';
import { AutomationExecutor } from '../../automation/executor';

// Initialize electron-store for automation scripts
const store = new Store();
const STORE_KEY = 'automation-scripts';

// In-memory execution history (could be persisted if needed)
const executionHistory = new Map<string, AutomationExecution[]>();

export function setupAutomationHandlers(): void {
  // Get all scripts for a repository
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_GET_SCRIPTS,
    async (_, repositoryId: string): Promise<Result<AutomationScript[]>> => {
      try {
        const allScripts = (store.get(STORE_KEY, []) as AutomationScript[]);
        const repoScripts = allScripts.filter((s) => s.repositoryId === repositoryId);
        return { success: true, data: repoScripts };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get scripts'),
        };
      }
    }
  );

  // Create a new script
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_CREATE_SCRIPT,
    async (_, script: AutomationScript): Promise<Result<AutomationScript>> => {
      try {
        const allScripts = (store.get(STORE_KEY, []) as AutomationScript[]);
        
        // Generate ID if not provided
        if (!script.id) {
          script.id = Date.now().toString();
        }
        
        // Set creation timestamp
        script.createdAt = new Date().toISOString();
        
        allScripts.push(script);
        store.set(STORE_KEY, allScripts);
        
        return { success: true, data: script };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to create script'),
        };
      }
    }
  );

  // Update an existing script
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_UPDATE_SCRIPT,
    async (_, updatedScript: AutomationScript): Promise<Result<AutomationScript>> => {
      try {
        const allScripts = (store.get(STORE_KEY, []) as AutomationScript[]);
        const index = allScripts.findIndex((s) => s.id === updatedScript.id);
        
        if (index === -1) {
          throw new Error('Script not found');
        }
        
        allScripts[index] = updatedScript;
        store.set(STORE_KEY, allScripts);
        
        return { success: true, data: updatedScript };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to update script'),
        };
      }
    }
  );

  // Delete a script
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_DELETE_SCRIPT,
    async (_, scriptId: string): Promise<Result<void>> => {
      try {
        const allScripts = (store.get(STORE_KEY, []) as AutomationScript[]);
        const filtered = allScripts.filter((s) => s.id !== scriptId);
        store.set(STORE_KEY, filtered);
        
        // Also delete execution history
        executionHistory.delete(scriptId);
        
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to delete script'),
        };
      }
    }
  );

  // Execute a script
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_EXECUTE_SCRIPT,
    async (_, scriptId: string, repoPath: string): Promise<Result<AutomationExecution>> => {
      try {
        const allScripts = (store.get(STORE_KEY, []) as AutomationScript[]);
        const script = allScripts.find((s) => s.id === scriptId);
        
        if (!script) {
          throw new Error('Script not found');
        }
        
        if (!script.enabled) {
          throw new Error('Script is disabled');
        }
        
        // Create executor and run script
        const executor = new AutomationExecutor(repoPath);
        const execution = await executor.executeScript(script);
        
        // Update last run timestamp
        script.lastRun = new Date().toISOString();
        const scriptIndex = allScripts.findIndex((s) => s.id === scriptId);
        if (scriptIndex !== -1) {
          allScripts[scriptIndex] = script;
          store.set(STORE_KEY, allScripts);
        }
        
        // Store execution history
        const history = executionHistory.get(scriptId) || [];
        history.push(execution);
        // Keep last 20 executions
        if (history.length > 20) {
          history.shift();
        }
        executionHistory.set(scriptId, history);
        
        return { success: true, data: execution };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to execute script'),
        };
      }
    }
  );

  // Get execution history for a script
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_GET_HISTORY,
    async (_, scriptId: string): Promise<Result<AutomationExecution[]>> => {
      try {
        const history = executionHistory.get(scriptId) || [];
        return { success: true, data: history };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get history'),
        };
      }
    }
  );
}
