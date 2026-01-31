import React from 'react';
import { GitBranch, RefreshCw, Search, ChevronRight } from 'lucide-react';
import type { Repository, Branch, Commit } from '@shared/types/git';

interface BranchesProps {
  repository: Repository;
  onSelectBranch: (branch: Branch) => void;
}

interface BranchWithCommit extends Branch {
  lastCommit?: Commit;
}

export const Branches: React.FC<BranchesProps> = ({ repository, onSelectBranch }) => {
  const [branches, setBranches] = React.useState<BranchWithCommit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    loadBranches();
  }, [repository.path]);

  const loadBranches = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      const branchesResult = await window.api.git.getBranches(repository.path);
      if (branchesResult.success) {
        // Get last commit for each branch
        const branchesWithCommits = await Promise.all(
          branchesResult.data.map(async (branch) => {
            try {
              const commitsResult = await window.api.git.getCommits(repository.path, { limit: 1, branch: branch.name });
              return {
                ...branch,
                lastCommit: commitsResult.success && commitsResult.data.length > 0 
                  ? commitsResult.data[0] 
                  : undefined,
              };
            } catch {
              return { ...branch, lastCommit: undefined };
            }
          })
        );
        
        setBranches(branchesWithCommits);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Branches</h2>
            <span className="text-sm text-muted">({filteredBranches.length})</span>
          </div>
          
          <button
            onClick={loadBranches}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="glass border-b border-border px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted">
          <div className="col-span-4">Branch Name</div>
          <div className="col-span-5">Last Commit</div>
          <div className="col-span-3">Author</div>
        </div>
      </div>

      {/* Branch List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted">Loading branches...</div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted">
              {searchQuery ? 'No branches found' : 'No branches'}
            </div>
          </div>
        ) : (
          <div>
            {filteredBranches.map((branch) => (
              <button
                key={branch.name}
                onClick={() => onSelectBranch(branch)}
                className="w-full px-4 py-3 border-b border-border hover:bg-surface-elevated transition-colors group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Branch Name */}
                  <div className="col-span-4 flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="font-medium truncate group-hover:text-accent transition-colors">
                      {branch.name}
                    </span>
                    {branch.name === repository.currentBranch && (
                      <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                        Current
                      </span>
                    )}
                    {branch.isRemote && (
                      <span className="text-xs px-2 py-0.5 bg-muted/20 text-muted rounded">
                        Remote
                      </span>
                    )}
                  </div>

                  {/* Last Commit */}
                  <div className="col-span-5 text-sm text-left truncate">
                    {branch.lastCommit ? (
                      <span className="text-text-primary">{branch.lastCommit.message}</span>
                    ) : (
                      <span className="text-muted">No commits</span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="col-span-3 flex items-center justify-between">
                    <span className="text-sm text-muted truncate">
                      {branch.lastCommit?.author.name || '-'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
