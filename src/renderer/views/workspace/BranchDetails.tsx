import React from 'react';
import { GitBranch, RefreshCw, Search, ChevronLeft, Calendar, User, Hash } from 'lucide-react';
import type { Repository, Branch, Commit } from '@shared/types/git';
import { CommitDetails } from './CommitDetails';

interface BranchDetailsProps {
  repository: Repository;
  branch: Branch;
  onBack: () => void;
}

export const BranchDetails: React.FC<BranchDetailsProps> = ({ repository, branch, onBack }) => {
  const [commits, setCommits] = React.useState<Commit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCommit, setSelectedCommit] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadCommits();
  }, [repository.path, branch.name]);

  const loadCommits = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      const commitsResult = await window.api.git.getCommits(repository.path, { 
        limit: 100, 
        branch: branch.name 
      });
      
      if (commitsResult.success) {
        setCommits(commitsResult.data);
      }
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommits = commits.filter((commit) =>
    commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commit.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  // Show commit details if a commit is selected
  if (selectedCommit) {
    return (
      <CommitDetails
        repository={repository}
        commitSha={selectedCommit}
        onBack={() => setSelectedCommit(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <GitBranch className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">{branch.name}</h2>
            <span className="text-sm text-muted">({filteredCommits.length} commits)</span>
          </div>
          
          <button
            onClick={loadCommits}
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
            placeholder="Search commits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="glass border-b border-border px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted">
          <div className="col-span-6">Commit Message</div>
          <div className="col-span-3">Author</div>
          <div className="col-span-3">Date</div>
        </div>
      </div>

      {/* Commits List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted">Loading commits...</div>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted">
              {searchQuery ? 'No commits found' : 'No commits in this branch'}
            </div>
          </div>
        ) : (
          <div>
            {filteredCommits.map((commit) => (
              <div
                key={commit.sha}
                onClick={() => setSelectedCommit(commit.sha)}
                className="px-4 py-4 border-b border-border hover:bg-surface-elevated transition-colors group"
              >
                <div className="grid grid-cols-12 gap-4">
                  {/* Commit Message */}
                  <div className="col-span-6">
                    <div className="flex items-start space-x-3">
                      <Hash className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary group-hover:text-accent transition-colors break-words">
                          {commit.message}
                        </p>
                        <p className="text-xs text-muted mt-1 font-mono">
                          {commit.sha.substring(0, 7)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{commit.author.name}</p>
                        <p className="text-xs text-muted truncate">{commit.author.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted flex-shrink-0" />
                      <div className="text-sm">
                        <p>{formatDate(commit.date)}</p>
                        <p className="text-xs text-muted">
                          {new Date(commit.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
