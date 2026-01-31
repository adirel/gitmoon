import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import * as gitOps from '../../git/operations';
import type { Result, Commit, Branch, RepositoryStatus, DiffResult } from '../../../shared/types/git';

export function setupGitHandlers(): void {
  // Get commits
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_COMMITS,
    async (_, repoPath: string, options?: { limit?: number; skip?: number; branch?: string }): Promise<Result<Commit[]>> => {
      try {
        const commits = await gitOps.getCommitHistory(
          repoPath, 
          options?.limit || 50, 
          options?.skip || 0,
          options?.branch
        );
        return { success: true, data: commits };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get commits'),
        };
      }
    }
  );

  // Get commit count
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_COMMIT_COUNT,
    async (_, repoPath: string, branch?: string): Promise<Result<number>> => {
      try {
        const count = await gitOps.getCommitCount(repoPath, branch);
        return { success: true, data: count };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get commit count'),
        };
      }
    }
  );

  // Get commit details
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_COMMIT_DETAILS,
    async (_, repoPath: string, sha: string): Promise<Result<Commit>> => {
      try {
        const commit = await gitOps.getCommitDetails(repoPath, sha);
        return { success: true, data: commit };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get commit details'),
        };
      }
    }
  );

  // Get branches
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_BRANCHES,
    async (_, repoPath: string): Promise<Result<Branch[]>> => {
      try {
        const branches = await gitOps.getBranches(repoPath);
        return { success: true, data: branches };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get branches'),
        };
      }
    }
  );

  // Get repository status
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_STATUS,
    async (_, repoPath: string): Promise<Result<RepositoryStatus>> => {
      try {
        const status = await gitOps.getStatus(repoPath);
        return { success: true, data: status };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get status'),
        };
      }
    }
  );

  // Compare branches
  ipcMain.handle(
    IPC_CHANNELS.GIT_COMPARE_BRANCHES,
    async (_, repoPath: string, base: string, compare: string): Promise<Result<DiffResult>> => {
      try {
        const diff = await gitOps.compareBranches(repoPath, base, compare);
        return { success: true, data: diff };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to compare branches'),
        };
      }
    }
  );

  // Get diff between branches for specific files
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_DIFF,
    async (_, repoPath: string, base: string, compare: string, filePaths: string[]): Promise<Result<string>> => {
      try {
        const diff = await gitOps.getBranchFileDiff(repoPath, base, compare, filePaths);
        return { success: true, data: diff };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get diff'),
        };
      }
    }
  );

  // Get commit file diff
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_COMMIT_FILE_DIFF,
    async (_, repoPath: string, commitSha: string, filePath: string): Promise<Result<string>> => {
      try {
        const diff = await gitOps.getCommitFileDiff(repoPath, commitSha, filePath);
        return { success: true, data: diff };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get file diff'),
        };
      }
    }
  );

  // Checkout branch
  ipcMain.handle(
    IPC_CHANNELS.GIT_CHECKOUT,
    async (_, repoPath: string, branch: string): Promise<Result<void>> => {
      try {
        await gitOps.checkout(repoPath, branch);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to checkout branch'),
        };
      }
    }
  );

  // Create branch
  ipcMain.handle(
    IPC_CHANNELS.GIT_CREATE_BRANCH,
    async (_, repoPath: string, branchName: string): Promise<Result<void>> => {
      try {
        await gitOps.createBranch(repoPath, branchName);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to create branch'),
        };
      }
    }
  );

  // Stage files
  ipcMain.handle(
    IPC_CHANNELS.GIT_STAGE_FILES,
    async (_, repoPath: string, files: string[]): Promise<Result<void>> => {
      try {
        await gitOps.stageFiles(repoPath, files);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to stage files'),
        };
      }
    }
  );

  // Commit
  ipcMain.handle(
    IPC_CHANNELS.GIT_COMMIT,
    async (_, repoPath: string, message: string): Promise<Result<void>> => {
      try {
        await gitOps.commit(repoPath, message);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to commit'),
        };
      }
    }
  );

  // Fetch
  ipcMain.handle(
    IPC_CHANNELS.GIT_FETCH,
    async (_, repoPath: string): Promise<Result<void>> => {
      try {
        await gitOps.fetch(repoPath);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to fetch'),
        };
      }
    }
  );

  // Pull
  ipcMain.handle(
    IPC_CHANNELS.GIT_PULL,
    async (_, repoPath: string): Promise<Result<void>> => {
      try {
        await gitOps.pull(repoPath);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to pull'),
        };
      }
    }
  );

  // Push
  ipcMain.handle(
    IPC_CHANNELS.GIT_PUSH,
    async (_, repoPath: string): Promise<Result<void>> => {
      try {
        await gitOps.push(repoPath);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to push'),
        };
      }
    }
  );

  // Get remote URL
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_REMOTE_URL,
    async (_, repoPath: string): Promise<Result<string | undefined>> => {
      try {
        const url = await gitOps.getRemoteUrl(repoPath);
        return { success: true, data: url };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get remote URL'),
        };
      }
    }
  );

  // Get last fetch time
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_LAST_FETCH_TIME,
    async (_, repoPath: string): Promise<Result<number | null>> => {
      try {
        const time = await gitOps.getLastFetchTime(repoPath);
        return { success: true, data: time };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get last fetch time'),
        };
      }
    }
  );
}
