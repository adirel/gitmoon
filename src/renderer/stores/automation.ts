import { create } from 'zustand';
import type { AutomationScript, AutomationExecution } from '@shared/types/automation';

interface AutomationStore {
  scripts: AutomationScript[];
  isLoading: boolean;
  isExecuting: boolean;
  currentExecution: AutomationExecution | null;
  
  // Actions
  setScripts: (scripts: AutomationScript[]) => void;
  addScript: (script: AutomationScript) => void;
  updateScript: (script: AutomationScript) => void;
  removeScript: (scriptId: string) => void;
  setLoading: (loading: boolean) => void;
  setExecuting: (executing: boolean) => void;
  setCurrentExecution: (execution: AutomationExecution | null) => void;
  
  // Async operations (using window.api)
  loadScripts: (repositoryId: string) => Promise<void>;
  createScript: (script: AutomationScript) => Promise<boolean>;
  updateScriptData: (script: AutomationScript) => Promise<boolean>;
  deleteScript: (scriptId: string) => Promise<boolean>;
  executeScript: (scriptId: string, repoPath: string) => Promise<AutomationExecution | null>;
}

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  scripts: [],
  isLoading: false,
  isExecuting: false,
  currentExecution: null,

  setScripts: (scripts) => set({ scripts }),
  
  addScript: (script) =>
    set((state) => ({
      scripts: [...state.scripts, script],
    })),
  
  updateScript: (script) =>
    set((state) => ({
      scripts: state.scripts.map((s) => (s.id === script.id ? script : s)),
    })),
  
  removeScript: (scriptId) =>
    set((state) => ({
      scripts: state.scripts.filter((s) => s.id !== scriptId),
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setExecuting: (executing) => set({ isExecuting: executing }),
  
  setCurrentExecution: (execution) => set({ currentExecution: execution }),

  // Load scripts for a repository
  loadScripts: async (repositoryId: string) => {
    set({ isLoading: true });
    try {
      const result = await window.api.automation.getScripts(repositoryId);
      if (result.success) {
        set({ scripts: result.data });
      }
    } catch (error) {
      console.error('Failed to load automation scripts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new script
  createScript: async (script: AutomationScript) => {
    try {
      const result = await window.api.automation.createScript(script);
      if (result.success) {
        get().addScript(result.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create script:', error);
      return false;
    }
  },

  // Update an existing script
  updateScriptData: async (script: AutomationScript) => {
    try {
      const result = await window.api.automation.updateScript(script);
      if (result.success) {
        get().updateScript(result.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update script:', error);
      return false;
    }
  },

  // Delete a script
  deleteScript: async (scriptId: string) => {
    try {
      const result = await window.api.automation.deleteScript(scriptId);
      if (result.success) {
        get().removeScript(scriptId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete script:', error);
      return false;
    }
  },

  // Execute a script
  executeScript: async (scriptId: string, repoPath: string) => {
    set({ isExecuting: true, currentExecution: null });
    try {
      const result = await window.api.automation.executeScript(scriptId, repoPath);
      if (result.success) {
        set({ currentExecution: result.data });
        
        // Reload scripts to update lastRun timestamp
        const script = get().scripts.find(s => s.id === scriptId);
        if (script) {
          await get().loadScripts(script.repositoryId);
        }
        
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to execute script:', error);
      return null;
    } finally {
      set({ isExecuting: false });
    }
  },
}));
