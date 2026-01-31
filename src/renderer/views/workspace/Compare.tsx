import React from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  FileText, 
  Plus, 
  Minus, 
  RefreshCw,
  AlertCircle,
  ChevronDown,
  GitCommit,
  Calendar,
  User
} from 'lucide-react';
import type { Repository, Branch, DiffResult, Commit } from '@shared/types/git';
import { DiffViewer } from '../../components/DiffViewer';

interface CompareProps {
  repository: Repository;
}

export const Compare: React.FC<CompareProps> = ({ repository }) => {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [baseBranch, setBaseBranch] = React.useState<string>(repository.currentBranch);
  const [compareBranch, setCompareBranch] = React.useState<string>('');
  const [diffResult, setDiffResult] = React.useState<DiffResult | null>(null);
  const [commits, setCommits] = React.useState<Commit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showBaseDropdown, setShowBaseDropdown] = React.useState(false);
  const [showCompareDropdown, setShowCompareDropdown] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<{ path: string; diff: string } | null>(null);

  React.useEffect(() => {
    loadBranches();
  }, [repository.path]);

  const loadBranches = async () => {
    if (!window.api) return;

    try {
      const result = await window.api.git.getBranches(repository.path);
      if (result.success) {
        setBranches(result.data);
        // Auto-select first remote branch as compare target if available
        if (!compareBranch && result.data.length > 0) {
          const remoteBranch = result.data.find(b => b.isRemote && b.name !== `origin/${repository.currentBranch}`);
          if (remoteBranch) {
            setCompareBranch(remoteBranch.name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleCompare = async () => {
    if (!window.api || !baseBranch || !compareBranch) return;

    setLoading(true);
    setError(null);

    try {
      // Get diff between branches
      const diffResponse = await window.api.git.compareBranches(
        repository.path,
        baseBranch,
        compareBranch
      );

      if (diffResponse.success) {
        setDiffResult(diffResponse.data);
      } else {
        setError(diffResponse.error?.message || 'Failed to compare branches');
      }

      // Get commits in compare branch that are not in base branch
      const commitsResponse = await window.api.git.getCommits(repository.path, {
        limit: 100,
        branch: `${baseBranch}..${compareBranch}`
      });

      if (commitsResponse.success) {
        setCommits(commitsResponse.data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to compare branches');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (baseBranch && compareBranch && baseBranch !== compareBranch) {
      handleCompare();
    }
  }, [baseBranch, compareBranch]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Plus className="w-3.5 h-3.5 text-success" />;
      case 'deleted':
        return <Minus className="w-3.5 h-3.5 text-error" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-warning" />;
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-success';
      case 'deleted':
        return 'text-error';
      default:
        return 'text-warning';
    }
  };

  const handleFileClick = async (filePath: string) => {
    if (!window.api || !baseBranch || !compareBranch) return;

    try {
      // Get diff for the specific file between branches
      const result = await window.api.git.getDiff(
        repository.path,
        baseBranch,
        compareBranch,
        [filePath]
      );

      if (result.success && result.data) {
        setSelectedFile({
          path: filePath,
          diff: result.data,
        });
      }
    } catch (error) {
      console.error('Failed to get file diff:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="glass p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Compare Branches</h2>
          
          {/* Branch Selector */}
          <div className="flex items-center space-x-3">
            {/* Base Branch */}
            <div className="flex-1 relative">
              <label className="text-xs text-muted mb-1 block">Base Branch</label>
              <button
                onClick={() => setShowBaseDropdown(!showBaseDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-surface-elevated rounded border border-border transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-accent" />
                  <span className="text-sm">{baseBranch}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              
              {showBaseDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                  {branches.map((branch) => (
                    <button
                      key={branch.name}
                      onClick={() => {
                        setBaseBranch(branch.name);
                        setShowBaseDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left ${
                        baseBranch === branch.name ? 'bg-surface-elevated' : ''
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm flex-1">{branch.name}</span>
                      {branch.isRemote && (
                        <span className="text-xs text-muted">Remote</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ArrowRight className="w-5 h-5 text-accent flex-shrink-0 mt-5" />

            {/* Compare Branch */}
            <div className="flex-1 relative">
              <label className="text-xs text-muted mb-1 block">Compare Branch</label>
              <button
                onClick={() => setShowCompareDropdown(!showCompareDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-surface-elevated rounded border border-border transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-accent" />
                  <span className="text-sm">{compareBranch || 'Select branch...'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              
              {showCompareDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                  {branches
                    .filter((b) => b.name !== baseBranch)
                    .map((branch) => (
                      <button
                        key={branch.name}
                        onClick={() => {
                          setCompareBranch(branch.name);
                          setShowCompareDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left ${
                          compareBranch === branch.name ? 'bg-surface-elevated' : ''
                        }`}
                      >
                        <GitBranch className="w-3.5 h-3.5 text-accent" />
                        <span className="text-sm flex-1">{branch.name}</span>
                        {branch.isRemote && (
                          <span className="text-xs text-muted">Remote</span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Compare Button */}
          {baseBranch && compareBranch && (
            <button
              onClick={handleCompare}
              disabled={loading || baseBranch === compareBranch}
              className="mt-4 flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent/80 text-background rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Comparison</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span className="ml-2 text-muted">Comparing branches...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass p-4 rounded-lg border border-error">
            <div className="flex items-center space-x-2 text-error">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-muted mt-2">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && diffResult && (
          <>
            {/* Summary */}
            <div className="glass p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Comparison Summary</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface px-4 py-3 rounded">
                  <div className="text-2xl font-bold text-accent">{commits.length}</div>
                  <div className="text-xs text-muted">Commits</div>
                </div>
                <div className="bg-surface px-4 py-3 rounded">
                  <div className="text-2xl font-bold text-success">+{diffResult.totalAdditions}</div>
                  <div className="text-xs text-muted">Additions</div>
                </div>
                <div className="bg-surface px-4 py-3 rounded">
                  <div className="text-2xl font-bold text-error">-{diffResult.totalDeletions}</div>
                  <div className="text-xs text-muted">Deletions</div>
                </div>
              </div>
            </div>

            {/* Commits */}
            {commits.length > 0 && (
              <div className="glass p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3">
                  Commits ({commits.length})
                </h3>
                
                <div className="space-y-2">
                  {commits.map((commit) => (
                    <div
                      key={commit.sha}
                      className="bg-surface hover:bg-surface-elevated p-3 rounded transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <GitCommit className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {commit.message}
                            </p>
                          </div>
                        </div>
                        <code className="text-xs text-muted font-mono ml-2">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted ml-6">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{commit.author.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(commit.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Changes */}
            {diffResult.files.length > 0 && (
              <div className="glass p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3">
                  Files Changed ({diffResult.files.length})
                </h3>
                
                <div className="space-y-1">
                  {diffResult.files.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleFileClick(file.path)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface hover:border-l-2 hover:border-accent rounded transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getFileIcon(file.status)}
                        <span className="text-sm font-mono truncate group-hover:text-accent transition-colors">
                          {file.path}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`text-xs font-medium ${getFileStatusColor(file.status)} capitalize`}>
                          {file.status}
                        </span>
                        {file.status !== 'deleted' && file.additions > 0 && (
                          <span className="text-xs text-success">+{file.additions}</span>
                        )}
                        {file.status !== 'added' && file.deletions > 0 && (
                          <span className="text-xs text-error">-{file.deletions}</span>
                        )}
                        <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          View diff →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Changes */}
            {commits.length === 0 && diffResult.files.length === 0 && (
              <div className="glass p-8 rounded-lg text-center">
                <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-lg font-medium">No differences found</p>
                <p className="text-sm text-muted mt-2">
                  The branches {baseBranch} and {compareBranch} are identical.
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !diffResult && !error && (
          <div className="glass p-8 rounded-lg text-center">
            <GitBranch className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-lg font-medium">Select branches to compare</p>
            <p className="text-sm text-muted mt-2">
              Choose a base branch and a compare branch to see the differences.
            </p>
          </div>
        )}
      </div>

      {/* Diff Viewer Modal */}
      {selectedFile && (
        <DiffViewer
          fileName={selectedFile.path}
          diff={selectedFile.diff}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};
