export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'generic';

export interface Repository {
  id: string;
  name: string;
  path: string;
  provider: GitProvider;
  currentBranch: string;
  remoteUrl?: string;
  lastSynced?: string | Date;
  isFavorite?: boolean;
}

export interface Author {
  name: string;
  email: string;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  filesChanged: number;
}

export interface Commit {
  sha: string;
  message: string;
  body?: string;
  author: Author;
  committer: Author;
  date: Date;
  parents: string[];
  stats?: CommitStats;
}

export interface Branch {
  name: string;
  sha: string;
  isRemote: boolean;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  oldPath?: string;
}

export interface DiffResult {
  files: FileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface RepositoryStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  conflicted: string[];
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
