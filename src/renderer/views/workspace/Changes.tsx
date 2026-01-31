import React from 'react';
import { 
  GitCommit, 
  RefreshCw, 
  Plus, 
  Minus, 
  FileText, 
  FilePlus, 
  FileX, 
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import type { Repository, RepositoryStatus, FileChange } from '@shared/types/git';

interface ChangesProps {
  repository: Repository;
}

export const Changes: React.FC<ChangesProps> = ({ repository }) => {
  const [status, setStatus] = React.useState<RepositoryStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [commitMessage, setCommitMessage] = React.useState('');
  const [committing, setCommitting] = React.useState(false);
  const [selectedStaged, setSelectedStaged] = React.useState<Set<string>>(new Set());
  const [selectedUnstaged, setSelectedUnstaged] = React.useState<Set<string>>(new Set());
  const [selectedUntracked, setSelectedUntracked] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    loadStatus();
  }, [repository.path]);

  const loadStatus = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      const statusResult = await window.api.git.getStatus(repository.path);
      if (statusResult.success) {
        setStatus(statusResult.data);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageFiles = async (files: string[]) => {
    if (!window.api || files.length === 0) return;

    try {
      const result = await window.api.git.stageFiles(repository.path, files);
      if (result.success) {
        setSelectedUnstaged(new Set());
        setSelectedUntracked(new Set());
        await loadStatus();
      }
    } catch (error) {
      console.error('Failed to stage files:', error);
    }
  };

  const handleUnstageFiles = async (files: string[]) => {
    if (!window.api || files.length === 0) return;

    try {
      const result = await window.api.git.unstageFiles(repository.path, files);
      if (result.success) {
        setSelectedStaged(new Set());
        await loadStatus();
      }
    } catch (error) {
      console.error('Failed to unstage files:', error);
    }
  };

  const handleCommit = async () => {
    if (!window.api || !commitMessage.trim() || !status || status.staged.length === 0) return;

    setCommitting(true);
    try {
      const result = await window.api.git.commit(repository.path, commitMessage);
      if (result.success) {
        setCommitMessage('');
        await loadStatus();
      }
    } catch (error) {
      console.error('Failed to commit:', error);
    } finally {
      setCommitting(false);
    }
  };

  const getFileIcon = (fileChange: FileChange) => {
    switch (fileChange.status) {
      case 'added':
        return <FilePlus className="w-4 h-4 text-success" />;
      case 'deleted':
        return <FileX className="w-4 h-4 text-error" />;
      case 'modified':
        return <FileText className="w-4 h-4 text-warning" />;
      default:
        return <FileText className="w-4 h-4 text-muted" />;
    }
  };

  const getStatusBadge = (fileChange: FileChange) => {
    const badges = {
      added: { text: 'A', color: 'text-success bg-success/20' },
      modified: { text: 'M', color: 'text-warning bg-warning/20' },
      deleted: { text: 'D', color: 'text-error bg-error/20' },
      renamed: { text: 'R', color: 'text-accent bg-accent/20' },
      copied: { text: 'C', color: 'text-accent bg-accent/20' },
    };

    const badge = badges[fileChange.status];
    return (
      <span className={`text-xs font-mono px-2 py-0.5 rounded ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const toggleStagedSelection = (path: string) => {
    const newSet = new Set(selectedStaged);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedStaged(newSet);
  };

  const toggleUnstagedSelection = (path: string) => {
    const newSet = new Set(selectedUnstaged);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedUnstaged(newSet);
  };

  const toggleUntrackedSelection = (path: string) => {
    const newSet = new Set(selectedUntracked);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedUntracked(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Loading changes...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Failed to load repository status</div>
      </div>
    );
  }

  const totalChanges = status.staged.length + status.unstaged.length + status.untracked.length + status.conflicted.length;

  return (
    <div className="h-full flex">
      {/* Left Panel - Changes List */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <div className="glass border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitCommit className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold">Changes</h2>
              <span className="text-sm text-muted">({totalChanges} files)</span>
            </div>
            
            <button
              onClick={loadStatus}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Changes Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Conflicts */}
          {status.conflicted.length > 0 && (
            <div className="border-b border-border">
              <div className="bg-error/10 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span className="font-medium text-error">Conflicted ({status.conflicted.length})</span>
                </div>
              </div>
              {status.conflicted.map((file) => (
                <div
                  key={file}
                  className="px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
                    <span className="font-mono text-sm flex-1 break-all">{file}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staged Changes */}
          {status.staged.length > 0 && (
            <div className="border-b border-border">
              <div className="bg-surface px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="font-medium">Staged Changes ({status.staged.length})</span>
                </div>
                <button
                  onClick={() => handleUnstageFiles(Array.from(selectedStaged))}
                  disabled={selectedStaged.size === 0}
                  className="text-xs px-3 py-1 bg-surface-elevated hover:bg-border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3 h-3 inline mr-1" />
                  Unstage Selected
                </button>
              </div>
              {status.staged.map((file) => (
                <div
                  key={file.path}
                  onClick={() => toggleStagedSelection(file.path)}
                  className={`px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border cursor-pointer ${
                    selectedStaged.has(file.path) ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedStaged.has(file.path)}
                      onChange={() => toggleStagedSelection(file.path)}
                      className="flex-shrink-0"
                    />
                    {getFileIcon(file)}
                    <span className="font-mono text-sm flex-1 break-all">{file.path}</span>
                    {getStatusBadge(file)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unstaged Changes */}
          {status.unstaged.length > 0 && (
            <div className="border-b border-border">
              <div className="bg-surface px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-warning" />
                  <span className="font-medium">Unstaged Changes ({status.unstaged.length})</span>
                </div>
                <button
                  onClick={() => handleStageFiles(Array.from(selectedUnstaged))}
                  disabled={selectedUnstaged.size === 0}
                  className="text-xs px-3 py-1 bg-surface-elevated hover:bg-border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Stage Selected
                </button>
              </div>
              {status.unstaged.map((file) => (
                <div
                  key={file.path}
                  onClick={() => toggleUnstagedSelection(file.path)}
                  className={`px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border cursor-pointer ${
                    selectedUnstaged.has(file.path) ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUnstaged.has(file.path)}
                      onChange={() => toggleUnstagedSelection(file.path)}
                      className="flex-shrink-0"
                    />
                    {getFileIcon(file)}
                    <span className="font-mono text-sm flex-1 break-all">{file.path}</span>
                    {getStatusBadge(file)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Untracked Files */}
          {status.untracked.length > 0 && (
            <div className="border-b border-border">
              <div className="bg-surface px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FilePlus className="w-4 h-4 text-muted" />
                  <span className="font-medium">Untracked Files ({status.untracked.length})</span>
                </div>
                <button
                  onClick={() => handleStageFiles(Array.from(selectedUntracked))}
                  disabled={selectedUntracked.size === 0}
                  className="text-xs px-3 py-1 bg-surface-elevated hover:bg-border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Stage Selected
                </button>
              </div>
              {status.untracked.map((file) => (
                <div
                  key={file}
                  onClick={() => toggleUntrackedSelection(file)}
                  className={`px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border cursor-pointer ${
                    selectedUntracked.has(file) ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUntracked.has(file)}
                      onChange={() => toggleUntrackedSelection(file)}
                      className="flex-shrink-0"
                    />
                    <FilePlus className="w-4 h-4 text-muted flex-shrink-0" />
                    <span className="font-mono text-sm flex-1 break-all">{file}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded text-muted bg-muted/20">
                      U
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Changes */}
          {totalChanges === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-muted">
                <Check className="w-8 h-8 mx-auto mb-2 text-success" />
                <p>No changes in working directory</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Commit */}
      <div className="w-96 flex flex-col glass">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Commit Changes</h3>
          <p className="text-xs text-muted mt-1">
            {status.staged.length} file{status.staged.length !== 1 ? 's' : ''} staged
          </p>
        </div>

        <div className="flex-1 flex flex-col p-4">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Enter commit message..."
            disabled={status.staged.length === 0}
            className="flex-1 bg-surface border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="mt-4 space-y-2">
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || status.staged.length === 0 || committing}
              className="w-full px-4 py-2 bg-accent hover:bg-accent/80 text-background rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {committing ? 'Committing...' : `Commit (${status.staged.length})`}
            </button>

            {status.staged.length === 0 && (
              <p className="text-xs text-muted text-center">
                Stage files to enable commit
              </p>
            )}
          </div>
        </div>

        {/* Branch Info */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Branch:</span>
              <span className="font-mono">{status.branch}</span>
            </div>
            {(status.ahead > 0 || status.behind > 0) && (
              <div className="flex justify-between">
                <span className="text-muted">Tracking:</span>
                <span className="font-mono">
                  {status.ahead > 0 && `↑${status.ahead}`}
                  {status.ahead > 0 && status.behind > 0 && ' '}
                  {status.behind > 0 && `↓${status.behind}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
