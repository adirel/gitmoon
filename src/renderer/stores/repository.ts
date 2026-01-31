import { create } from 'zustand';
import type { Repository } from '@shared/types/git';

interface RepositoryStore {
  repositories: Repository[];
  selectedRepo: Repository | null;
  isLoading: boolean;
  
  // Actions
  setRepositories: (repos: Repository[]) => void;
  addRepository: (repo: Repository) => void;
  removeRepository: (repoId: string) => void;
  updateRepository: (repo: Repository) => void;
  selectRepository: (repoId: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useRepositoryStore = create<RepositoryStore>((set) => ({
  repositories: [],
  selectedRepo: null,
  isLoading: false,

  setRepositories: (repos) => set({ repositories: repos }),
  
  addRepository: (repo) =>
    set((state) => ({
      repositories: [...state.repositories, repo],
    })),
  
  removeRepository: (repoId) =>
    set((state) => ({
      repositories: state.repositories.filter((r) => r.id !== repoId),
      selectedRepo: state.selectedRepo?.id === repoId ? null : state.selectedRepo,
    })),
  
  updateRepository: (repo) =>
    set((state) => ({
      repositories: state.repositories.map((r) => (r.id === repo.id ? repo : r)),
      selectedRepo: state.selectedRepo?.id === repo.id ? repo : state.selectedRepo,
    })),
  
  selectRepository: (repoId) =>
    set((state) => ({
      selectedRepo: repoId
        ? state.repositories.find((r) => r.id === repoId) || null
        : null,
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));
