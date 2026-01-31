import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type {
  Repository,
  Commit,
  Branch,
  RepositoryStatus,
  DiffResult,
  ConnectionStatus,
  Result,
} from '../shared/types/git';
import type {
  AutomationScript,
  AutomationExecution,
} from '../shared/types/automation';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
const api = {
  // Repository operations
  repository: {
    getAll: (): Promise<Result<Repository[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPO_GET_ALL),
    
    add: (repository: Repository): Promise<Result<Repository>> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPO_ADD, repository),
    
    remove: (repoId: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPO_REMOVE, repoId),
    
    update: (repository: Repository): Promise<Result<Repository>> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPO_UPDATE, repository),
  },

  // Git operations
  git: {
    getCommits: (repoPath: string, options?: { limit?: number; skip?: number; branch?: string }): Promise<Result<Commit[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMITS, repoPath, options),
    
    getCommitCount: (repoPath: string, branch?: string): Promise<Result<number>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_COUNT, repoPath, branch),
    
    getCommitDetails: (repoPath: string, sha: string): Promise<Result<Commit>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_DETAILS, repoPath, sha),
    
    getBranches: (repoPath: string): Promise<Result<Branch[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCHES, repoPath),
    
    getStatus: (repoPath: string): Promise<Result<RepositoryStatus>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STATUS, repoPath),
    
    compareBranches: (
      repoPath: string,
      base: string,
      compare: string
    ): Promise<Result<DiffResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_COMPARE_BRANCHES, repoPath, base, compare),
    
    getDiff: (
      repoPath: string,
      base: string,
      compare: string,
      filePaths: string[]
    ): Promise<Result<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_DIFF, repoPath, base, compare, filePaths),
    
    getCommitFileDiff: (repoPath: string, commitSha: string, filePath: string): Promise<Result<string>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_FILE_DIFF, repoPath, commitSha, filePath),
    
    checkout: (repoPath: string, branch: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_CHECKOUT, repoPath, branch),
    
    createBranch: (repoPath: string, branchName: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_BRANCH, repoPath, branchName),
    
    stageFiles: (repoPath: string, files: string[]): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_FILES, repoPath, files),
    
    commit: (repoPath: string, message: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, repoPath, message),
    
    fetch: (repoPath: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_FETCH, repoPath),
    
    pull: (repoPath: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, repoPath),
    
    push: (repoPath: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, repoPath),
    
    getRemoteUrl: (repoPath: string): Promise<Result<string | undefined>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_REMOTE_URL, repoPath),
    
    getLastFetchTime: (repoPath: string): Promise<Result<number | null>> =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_LAST_FETCH_TIME, repoPath),
  },

  // Network operations
  network: {
    checkStatus: (): Promise<Result<ConnectionStatus>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NETWORK_CHECK_STATUS),
    
    onStatusChanged: (callback: (status: ConnectionStatus) => void) => {
      ipcRenderer.on(IPC_CHANNELS.NETWORK_STATUS_CHANGED, (_, status) => callback(status));
    },
  },

  // Automation operations
  automation: {
    getScripts: (repositoryId: string): Promise<Result<AutomationScript[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_GET_SCRIPTS, repositoryId),
    
    createScript: (script: AutomationScript): Promise<Result<AutomationScript>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_CREATE_SCRIPT, script),
    
    updateScript: (script: AutomationScript): Promise<Result<AutomationScript>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_UPDATE_SCRIPT, script),
    
    deleteScript: (scriptId: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_DELETE_SCRIPT, scriptId),
    
    executeScript: (scriptId: string, repoPath: string): Promise<Result<AutomationExecution>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_EXECUTE_SCRIPT, scriptId, repoPath),
    
    getHistory: (scriptId: string): Promise<Result<AutomationExecution[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AUTOMATION_GET_HISTORY, scriptId),
  },

  // App operations
  app: {
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    
    quit: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    
    selectFolder: (): Promise<Result<{ path: string; name: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_SELECT_FOLDER),
    
    openPath: (path: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_PATH, path),
    
    openTerminal: (path: string): Promise<Result<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_TERMINAL, path),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// Type declaration for TypeScript
export type API = typeof api;
