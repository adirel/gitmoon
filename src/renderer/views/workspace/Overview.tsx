import React from 'react';
import { 
  GitBranch, 
  Link2, 
  FolderOpen, 
  Calendar, 
  GitCommit, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Upload, 
  GitPullRequest,
  FolderOpen as FolderIcon,
  Terminal,
  ChevronDown
} from 'lucide-react';
import type { Repository, RepositoryStatus, Commit } from '@shared/types/git';
import { CommitFrequencyGraph } from '../../components/CommitFrequencyGraph';

interface OverviewProps {
  repository: Repository;
}

export const Overview: React.FC<OverviewProps> = ({ repository }) => {
  const [status, setStatus] = React.useState<RepositoryStatus | null>(null);
  const [commitCount, setCommitCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [remoteUrl, setRemoteUrl] = React.useState<string | undefined>(repository.remoteUrl);
  const [lastFetchTime, setLastFetchTime] = React.useState<Date | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [commits, setCommits] = React.useState<Commit[]>([]);
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('month');
  const [graphLoading, setGraphLoading] = React.useState(false);

  React.useEffect(() => {
    loadRepositoryInfo();
    loadCommitHistory();
  }, [repository.path]);

  React.useEffect(() => {
    loadCommitHistory();
  }, [timeRange, repository.path]);

  const loadRepositoryInfo = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      // Get repository status
      const statusResult = await window.api.git.getStatus(repository.path);
      if (statusResult.success) {
        setStatus(statusResult.data);
      }

      // Get commit count
      const countResult = await window.api.git.getCommitCount(repository.path);
      if (countResult.success) {
        setCommitCount(countResult.data);
      }

      // Get last fetch time from git config
      try {
        const fetchResult = await window.api.git.getLastFetchTime(repository.path);
        if (fetchResult.success && fetchResult.data) {
          setLastFetchTime(new Date(fetchResult.data * 1000));
        }
      } catch (error) {
        console.error('Failed to get last fetch time:', error);
      }

      // Get remote URL if not already set
      if (!remoteUrl) {
        const remoteResult = await window.api.git.getRemoteUrl(repository.path);
        if (remoteResult.success && remoteResult.data) {
          setRemoteUrl(remoteResult.data);
          
          // Update the repository in the store
          const updatedRepo = {
            ...repository,
            remoteUrl: remoteResult.data,
          };
          await window.api.repository.update(updatedRepo);
        }
      }
    } catch (error) {
      console.error('Failed to load repository info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommitHistory = async () => {
    if (!window.api) return;

    setGraphLoading(true);
    try {
      // Calculate how many commits to fetch based on time range
      const limits = {
        week: 100,
        month: 500,
        year: 2000,
      };

      const result = await window.api.git.getCommits(repository.path, {
        limit: limits[timeRange],
      });

      if (result.success) {
        setCommits(result.data);
      }
    } catch (error) {
      console.error('Failed to load commit history:', error);
    } finally {
      setGraphLoading(false);
    }
  };

  const handleOpenInExplorer = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('explorer');
    const result = await window.api.app.openPath(repository.path);
    if (!result.success) {
      console.error('Failed to open in explorer:', result.error);
    }
    setActionLoading(null);
  };

  const handleOpenInTerminal = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('terminal');
    const result = await window.api.app.openTerminal(repository.path);
    if (!result.success) {
      console.error('Failed to open terminal:', result.error);
    }
    setActionLoading(null);
  };

  const handleRefresh = () => {
    if (actionLoading) return;
    setActionLoading('refresh');
    loadRepositoryInfo().finally(() => setActionLoading(null));
  };

  const handleFetch = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('fetch');
    const result = await window.api.git.fetch(repository.path);
    if (result.success) {
      await loadRepositoryInfo();
    } else {
      console.error('Failed to fetch:', result.error);
    }
    setActionLoading(null);
  };

  const handlePull = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('pull');
    const result = await window.api.git.pull(repository.path);
    if (result.success) {
      await loadRepositoryInfo();
    } else {
      console.error('Failed to pull:', result.error);
    }
    setActionLoading(null);
  };

  const handlePush = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('push');
    const result = await window.api.git.push(repository.path);
    if (result.success) {
      await loadRepositoryInfo();
    } else {
      console.error('Failed to push:', result.error);
    }
    setActionLoading(null);
  };

  const handleSync = async () => {
    if (!window.api || actionLoading) return;
    setActionLoading('sync');
    
    // Fetch first
    const fetchResult = await window.api.git.fetch(repository.path);
    if (!fetchResult.success) {
      console.error('Failed to fetch:', fetchResult.error);
      setActionLoading(null);
      return;
    }
    
    // Then pull
    const pullResult = await window.api.git.pull(repository.path);
    if (!pullResult.success) {
      console.error('Failed to pull:', pullResult.error);
      setActionLoading(null);
      return;
    }
    
    // Finally push
    const pushResult = await window.api.git.push(repository.path);
    if (pushResult.success) {
      await loadRepositoryInfo();
    } else {
      console.error('Failed to push:', pushResult.error);
    }
    
    setActionLoading(null);
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Loading repository information...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Quick Actions at Top */}
        <div className="glass p-3 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleSync}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-accent hover:bg-accent/80 text-background rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <GitPullRequest className={`w-4 h-4 ${actionLoading === 'sync' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'sync' ? 'Syncing...' : 'Sync'}</span>
            </button>
            <button 
              onClick={handleFetch}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading === 'fetch' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'fetch' ? 'Fetching...' : 'Fetch'}</span>
            </button>
            <button 
              onClick={handlePull}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download className={`w-4 h-4 ${actionLoading === 'pull' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'pull' ? 'Pulling...' : 'Pull'}</span>
            </button>
            <button 
              onClick={handlePush}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Upload className={`w-4 h-4 ${actionLoading === 'push' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'push' ? 'Pushing...' : 'Push'}</span>
            </button>
            <div className="flex-1"></div>
            <button 
              onClick={handleOpenInExplorer}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FolderIcon className={`w-4 h-4 ${actionLoading === 'explorer' ? 'animate-spin' : ''}`} />
              <span>Explorer</span>
            </button>
            <button 
              onClick={handleOpenInTerminal}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Terminal className={`w-4 h-4 ${actionLoading === 'terminal' ? 'animate-spin' : ''}`} />
              <span>Terminal</span>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={!!actionLoading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Repository Details */}
        <div className="glass p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3">Repository Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
            {/* Current Branch */}
            <div className="flex items-center space-x-2">
              <GitBranch className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Branch</div>
                <div className="font-medium truncate">{repository.currentBranch}</div>
              </div>
            </div>

            {/* Provider */}
            <div className="flex items-center space-x-2">
              <Link2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Provider</div>
                <div className="font-medium capitalize truncate">{repository.provider}</div>
              </div>
            </div>

            {/* Commit Count */}
            <div className="flex items-center space-x-2">
              <GitCommit className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Total Commits</div>
                <div className="font-medium">{commitCount}</div>
              </div>
            </div>

            {/* Last Fetched */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Last Fetched</div>
                <div className="font-medium truncate">{formatDate(lastFetchTime || repository.lastSynced)}</div>
              </div>
            </div>

            {/* Local Path - Full Width */}
            <div className="flex items-center space-x-2 md:col-span-2">
              <FolderOpen className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Local Path</div>
                <div className="font-mono text-xs bg-surface px-2 py-1 rounded mt-0.5 truncate" title={repository.path}>
                  {repository.path}
                </div>
              </div>
            </div>

            {/* Remote URL - Full Width */}
            <div className="flex items-center space-x-2 md:col-span-3">
              <Link2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted">Remote URL</div>
                {remoteUrl ? (
                  <div className="font-mono text-xs bg-surface px-2 py-1 rounded mt-0.5 truncate" title={remoteUrl}>
                    {remoteUrl}
                  </div>
                ) : (
                  <div className="text-muted mt-0.5">No remote configured</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Working Directory Status */}
        {status && (
          <div className="glass p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Working Directory</h3>
            
            <div className="space-y-2">
              {/* Upstream tracking */}
              {(status.ahead > 0 || status.behind > 0) && (
                <div className="flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-warning" />
                  <span>
                    {status.ahead > 0 && `${status.ahead} commit${status.ahead > 1 ? 's' : ''} ahead`}
                    {status.ahead > 0 && status.behind > 0 && ', '}
                    {status.behind > 0 && `${status.behind} commit${status.behind > 1 ? 's' : ''} behind`}
                  </span>
                </div>
              )}

              {/* File changes summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-surface px-3 py-2 rounded">
                  <div className="text-xl font-bold text-success">{status.staged.length}</div>
                  <div className="text-xs text-muted">Staged</div>
                </div>
                <div className="bg-surface px-3 py-2 rounded">
                  <div className="text-xl font-bold text-warning">{status.unstaged.length}</div>
                  <div className="text-xs text-muted">Modified</div>
                </div>
                <div className="bg-surface px-3 py-2 rounded">
                  <div className="text-xl font-bold text-muted">{status.untracked.length}</div>
                  <div className="text-xs text-muted">Untracked</div>
                </div>
                <div className="bg-surface px-3 py-2 rounded">
                  <div className="text-xl font-bold text-error">{status.conflicted.length}</div>
                  <div className="text-xs text-muted">Conflicts</div>
                </div>
              </div>

              {/* Clean state */}
              {status.staged.length === 0 && 
               status.unstaged.length === 0 && 
               status.untracked.length === 0 &&
               status.conflicted.length === 0 && (
                <div className="text-center py-3 text-success text-sm">
                  ✓ Working directory is clean
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commit Frequency Graph */}
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Commit Activity</h3>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
                disabled={graphLoading}
                className="appearance-none bg-surface hover:bg-surface-elevated text-sm px-3 py-1.5 pr-8 rounded border border-border focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
          
          {graphLoading ? (
            <div className="flex items-center justify-center h-48 text-muted text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading commit data...
            </div>
          ) : (
            <CommitFrequencyGraph commits={commits} timeRange={timeRange} />
          )}
        </div>
      </div>
    </div>
  );
};
