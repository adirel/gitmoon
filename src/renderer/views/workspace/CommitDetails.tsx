import React from 'react';
import { 
  ChevronLeft, 
  Hash, 
  User, 
  Calendar, 
  FileText, 
  FilePlus, 
  FileX, 
  FileEdit,
  Plus,
  Minus
} from 'lucide-react';
import type { Repository, Commit, FileChange } from '@shared/types/git';
import { DiffViewer } from '../../components/DiffViewer';

interface CommitDetailsProps {
  repository: Repository;
  commitSha: string;
  onBack: () => void;
}

export const CommitDetails: React.FC<CommitDetailsProps> = ({ repository, commitSha, onBack }) => {
  const [commit, setCommit] = React.useState<(Commit & { files?: FileChange[] }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedFile, setSelectedFile] = React.useState<{ path: string; diff: string } | null>(null);

  React.useEffect(() => {
    loadCommitDetails();
  }, [repository.path, commitSha]);

  const loadCommitDetails = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      const result = await window.api.git.getCommitDetails(repository.path, commitSha);
      if (result.success) {
        setCommit(result.data);
      }
    } catch (error) {
      console.error('Failed to load commit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (filePath: string) => {
    if (!window.api) return;

    try {
      const result = await window.api.git.getCommitFileDiff(repository.path, commitSha, filePath);
      if (result.success) {
        setSelectedFile({ path: filePath, diff: result.data });
      }
    } catch (error) {
      console.error('Failed to load file diff:', error);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileChange: FileChange) => {
    switch (fileChange.status) {
      case 'added':
        return <FilePlus className="w-4 h-4 text-success" />;
      case 'deleted':
        return <FileX className="w-4 h-4 text-error" />;
      case 'modified':
        return <FileEdit className="w-4 h-4 text-warning" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Loading commit details...</div>
      </div>
    );
  }

  if (!commit) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Failed to load commit details</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Diff Viewer Modal */}
      {selectedFile && (
        <DiffViewer
          diff={selectedFile.diff}
          fileName={selectedFile.path}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Header */}
      <div className="glass border-b border-border p-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Hash className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-xl font-semibold">{commit.message}</h2>
            <p className="text-xs text-muted font-mono mt-1">{commit.sha}</p>
          </div>
        </div>

        {/* Commit Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted" />
            <div>
              <span className="text-muted">Author: </span>
              <span className="font-medium">{commit.author.name}</span>
              <span className="text-muted text-xs ml-2">{commit.author.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted" />
            <div>
              <span className="text-muted">Date: </span>
              <span className="font-medium">{formatDate(commit.date)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {commit.stats && (
          <div className="flex items-center space-x-4 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted" />
              <span className="font-medium">{commit.stats.filesChanged}</span>
              <span className="text-muted">file{commit.stats.filesChanged !== 1 ? 's' : ''} changed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-success" />
              <span className="font-medium text-success">{commit.stats.additions}</span>
              <span className="text-muted">addition{commit.stats.additions !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Minus className="w-4 h-4 text-error" />
              <span className="font-medium text-error">{commit.stats.deletions}</span>
              <span className="text-muted">deletion{commit.stats.deletions !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Commit Body */}
        {commit.body && (
          <div className="mt-4 p-3 bg-surface rounded text-sm">
            <pre className="whitespace-pre-wrap break-words">{commit.body}</pre>
          </div>
        )}
      </div>

      {/* Files Changed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3">Files Changed ({commit.files?.length || 0})</h3>
          
          {commit.files && commit.files.length > 0 ? (
            <div className="space-y-1">
              {commit.files.map((file, index) => (
                <div
                  key={index}
                  onClick={() => handleFileClick(file.path)}
                  className="glass p-3 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <span className="font-mono text-sm flex-1 break-all">{file.path}</span>
                    {getStatusBadge(file)}
                    <div className="flex items-center space-x-3 text-xs">
                      {file.additions > 0 && (
                        <span className="text-success">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="text-error">-{file.deletions}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              No file changes detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
