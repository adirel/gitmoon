import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import Store from 'electron-store';
import type { Repository, Result } from '../../../shared/types/git';

const store = new Store<{ repositories: Repository[] }>({
  defaults: {
    repositories: [],
  },
});

export function setupRepositoryHandlers(): void {
  // Get all repositories
  ipcMain.handle(IPC_CHANNELS.REPO_GET_ALL, async (): Promise<Result<Repository[]>> => {
    try {
      const repositories = store.get('repositories', []);
      return { success: true, data: repositories };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get repositories'),
      };
    }
  });

  // Add repository
  ipcMain.handle(
    IPC_CHANNELS.REPO_ADD,
    async (_, repository: Repository): Promise<Result<Repository>> => {
      try {
        const repositories = store.get('repositories', []);
        const newRepo = {
          ...repository,
          id: repository.id || `repo_${Date.now()}`,
        };
        repositories.push(newRepo);
        store.set('repositories', repositories);
        return { success: true, data: newRepo };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to add repository'),
        };
      }
    }
  );

  // Remove repository
  ipcMain.handle(IPC_CHANNELS.REPO_REMOVE, async (_, repoId: string): Promise<Result<void>> => {
    try {
      const repositories = store.get('repositories', []);
      const filtered = repositories.filter((r) => r.id !== repoId);
      store.set('repositories', filtered);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to remove repository'),
      };
    }
  });

  // Update repository
  ipcMain.handle(
    IPC_CHANNELS.REPO_UPDATE,
    async (_, repository: Repository): Promise<Result<Repository>> => {
      try {
        const repositories = store.get('repositories', []);
        const index = repositories.findIndex((r) => r.id === repository.id);
        if (index !== -1) {
          repositories[index] = repository;
          store.set('repositories', repositories);
          return { success: true, data: repository };
        }
        return {
          success: false,
          error: new Error('Repository not found'),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to update repository'),
        };
      }
    }
  );
}
