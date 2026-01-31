import React from 'react';
import { 
  GitBranch, 
  GitCommit, 
  User, 
  Calendar, 
  ChevronDown,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import type { Repository, Branch, Commit } from '@shared/types/git';

interface GraphProps {
  repository: Repository;
}

interface CommitNode extends Commit {
  x: number;
  y: number;
  lane: number;
  branches: string[];
}

export const Graph: React.FC<GraphProps> = ({ repository }) => {
  const [commits, setCommits] = React.useState<CommitNode[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showBranchDropdown, setShowBranchDropdown] = React.useState(false);
  const [selectedCommit, setSelectedCommit] = React.useState<Commit | null>(null);

  React.useEffect(() => {
    loadData();
  }, [repository.path, selectedBranch]);

  const loadData = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      // Load branches
      const branchResult = await window.api.git.getBranches(repository.path);
      if (branchResult.success) {
        setBranches(branchResult.data);
      }

      // Load commits
      const commitOptions = selectedBranch === 'all' 
        ? { limit: 100 } 
        : { limit: 100, branch: selectedBranch };

      const commitResult = await window.api.git.getCommits(repository.path, commitOptions);
      if (commitResult.success) {
        const processedCommits = processCommitsForGraph(commitResult.data);
        setCommits(processedCommits);
      }
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCommitsForGraph = (rawCommits: Commit[]): CommitNode[] => {
    if (rawCommits.length === 0) return [];
    
    const commitMap = new Map<string, CommitNode>();
    const commitToLane = new Map<string, number>();
    const childCount = new Map<string, number>(); // Track how many children each commit has
    const activeLanes: Set<number> = new Set(); // Track which lanes are in use
    
    // Initialize nodes (preserve visual order - newest at top)
    rawCommits.forEach((commit, index) => {
      const node: CommitNode = {
        ...commit,
        x: 0,
        y: index * 80,
        lane: 0,
        branches: [],
      };
      commitMap.set(commit.sha, node);
    });
    
    // Count children for each commit
    rawCommits.forEach(commit => {
      if (commit.parents) {
        commit.parents.forEach(parentSha => {
          childCount.set(parentSha, (childCount.get(parentSha) || 0) + 1);
        });
      }
    });
    
    // Process commits in REVERSE order (oldest first) so parents get lanes before children
    const reversed = [...rawCommits].reverse();
    
    reversed.forEach((commit) => {
      const node = commitMap.get(commit.sha)!;
      let lane = -1;
      
      // If this commit has children, try to use the lane of its first child
      const firstChild = rawCommits.find(c => 
        c.parents && c.parents[0] === commit.sha
      );
      
      if (firstChild && commitToLane.has(firstChild.sha)) {
        // Continue in child's lane (we're the parent, child continues our line)
        lane = commitToLane.get(firstChild.sha)!;
      } else if (commit.parents && commit.parents.length > 0) {
        // This is a new branch point or merge
        const firstParentSha = commit.parents[0];
        
        // If parent has a lane and we're not their main child, get a new lane
        if (commitToLane.has(firstParentSha)) {
          const parentLane = commitToLane.get(firstParentSha)!;
          
          // Check if parent's main child is already using that lane
          const parentMainChild = rawCommits.find(c =>
            c.parents && c.parents[0] === firstParentSha
          );
          
          if (parentMainChild && commitToLane.has(parentMainChild.sha)) {
            // Parent's main line is taken, we're a branch - get new lane
            lane = 0;
            while (activeLanes.has(lane)) lane++;
          } else {
            // We are the main child, use parent's lane
            lane = parentLane;
          }
        }
      }
      
      // If still no lane, find first available
      if (lane === -1) {
        lane = 0;
        while (activeLanes.has(lane)) lane++;
      }
      
      // Assign lane
      node.lane = lane;
      node.x = lane * 40;
      commitToLane.set(commit.sha, lane);
      activeLanes.add(lane);
      
      // Free lane if this commit has no more children to process
      const children = rawCommits.filter(c => 
        c.parents && c.parents.includes(commit.sha)
      );
      
      if (children.length === 0 || children.every(c => commitToLane.has(c.sha))) {
        // All children processed, can free the lane
        activeLanes.delete(lane);
      }
    });

    // Assign branches to commits
    branches.forEach(branch => {
      const commit = commitMap.get(branch.sha);
      if (commit) {
        commit.branches.push(branch.name);
      }
    });

    return Array.from(commitMap.values());
  };

  const filteredCommits = React.useMemo(() => {
    if (!searchTerm) return commits;
    
    const term = searchTerm.toLowerCase();
    return commits.filter(commit => 
      commit.message.toLowerCase().includes(term) ||
      commit.author.name.toLowerCase().includes(term) ||
      commit.sha.toLowerCase().includes(term)
    );
  }, [commits, searchTerm]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getBranchColor = (branchName: string) => {
    // Hash branch name to generate consistent color
    let hash = 0;
    for (let i = 0; i < branchName.length; i++) {
      hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'rgb(0, 212, 255)',   // accent
      'rgb(34, 197, 94)',   // success
      'rgb(251, 191, 36)',  // warning
      'rgb(244, 63, 94)',   // error
      'rgb(168, 85, 247)',  // purple
      'rgb(236, 72, 153)',  // pink
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="p-4 glass border-b border-border relative z-30">
        <div className="flex items-center space-x-3">
          {/* Branch Filter */}
          <div className="relative flex-shrink-0 z-20">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-surface hover:bg-surface-elevated rounded border border-border transition-colors"
            >
              <GitBranch className="w-4 h-4 text-accent" />
              <span className="text-sm">
                {selectedBranch === 'all' ? 'All Branches' : selectedBranch}
              </span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>

            {showBranchDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[200px] max-h-64 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => {
                    setSelectedBranch('all');
                    setShowBranchDropdown(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left ${
                    selectedBranch === 'all' ? 'bg-surface-elevated' : ''
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm">All Branches</span>
                </button>
                {branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => {
                      setSelectedBranch(branch.name);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left ${
                      selectedBranch === branch.name ? 'bg-surface-elevated' : ''
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-accent" />
                    <span className="text-sm flex-1 truncate">{branch.name}</span>
                    {branch.isRemote && (
                      <span className="text-xs text-muted">Remote</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search commits..."
              className="w-full pl-9 pr-9 py-2 bg-surface border border-border rounded focus:outline-none focus:border-accent transition-colors text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-elevated rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Stats */}
          <div className="flex items-center space-x-4 px-3 py-2 bg-surface rounded text-sm">
            <div className="flex items-center space-x-1">
              <GitCommit className="w-4 h-4 text-accent" />
              <span className="text-muted">{filteredCommits.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitBranch className="w-4 h-4 text-success" />
              <span className="text-muted">{branches.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span className="ml-2 text-muted">Loading commit graph...</span>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <GitCommit className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-lg font-medium">No commits found</p>
              <p className="text-sm text-muted mt-2">
                {searchTerm ? 'Try a different search term' : 'This repository has no commits'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative p-6" style={{ minHeight: `${filteredCommits.length * 80 + 100}px` }}>
            {/* Background Lane Lines */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              {/* Draw vertical lane guides */}
              {Array.from({ length: Math.max(...filteredCommits.map(c => c.lane)) + 1 }).map((_, laneIndex) => (
                <line
                  key={`lane-${laneIndex}`}
                  x1={30 + laneIndex * 40}
                  y1={0}
                  x2={30 + laneIndex * 40}
                  y2="100%"
                  stroke="rgba(100, 116, 139, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </svg>
            
            {/* Graph Lines SVG */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                {/* Define gradients for different branch colors */}
                <linearGradient id="line-gradient-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(0, 212, 255)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="rgb(0, 212, 255)" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              {filteredCommits.flatMap((commit) => {
                if (!commit.parents || commit.parents.length === 0) return [];
                
                return commit.parents.map((parentSha, pIndex) => {
                  const parentCommit = filteredCommits.find(c => c.sha === parentSha);
                  if (!parentCommit) return null;
                  
                  const x1 = 30 + commit.x;
                  const y1 = 30 + commit.y;
                  const x2 = 30 + parentCommit.x;
                  const y2 = 30 + parentCommit.y;
                  
                  // Use branch color or default
                  const color = commit.branches.length > 0 
                    ? getBranchColor(commit.branches[0])
                    : 'rgb(100, 116, 139)';
                  
                  // If lanes are different, draw a curved line (merge/branch)
                  if (commit.lane !== parentCommit.lane) {
                    // Curved line for merges
                    const midY = (y1 + y2) / 2;
                    const controlX1 = x1;
                    const controlX2 = x2;
                    
                    return (
                      <g key={`${commit.sha}-${parentSha}-${pIndex}`}>
                        <path
                          d={`M ${x1},${y1} C ${controlX1},${midY} ${controlX2},${midY} ${x2},${y2}`}
                          stroke={color}
                          strokeWidth="3"
                          fill="none"
                          strokeOpacity="0.7"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  } else {
                    // Straight line for same lane
                    return (
                      <line
                        key={`${commit.sha}-${parentSha}-${pIndex}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth="3"
                        strokeOpacity="0.7"
                        strokeLinecap="round"
                      />
                    );
                  }
                }).filter(Boolean);
              })}
            </svg>

            {/* Commit Nodes */}
            <div className="relative" style={{ zIndex: 2 }}>
              {filteredCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="absolute flex items-start space-x-4"
                  style={{
                    top: `${commit.y}px`,
                    left: `${commit.x}px`,
                  }}
                >
                  {/* Node */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-6 h-6 rounded-full border-4 border-background cursor-pointer hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: commit.branches.length > 0 
                          ? getBranchColor(commit.branches[0]) 
                          : 'rgb(100, 116, 139)',
                        boxShadow: `0 0 10px ${commit.branches.length > 0 ? getBranchColor(commit.branches[0]) : 'rgba(100, 116, 139, 0.5)'}`,
                      }}
                      onClick={() => setSelectedCommit(commit)}
                    />
                  </div>

                  {/* Commit Info */}
                  <div
                    className="glass p-3 rounded-lg cursor-pointer hover:border-accent border border-transparent transition-all flex-1"
                    style={{ width: 'calc(100vw - 280px)', maxWidth: '800px' }}
                    onClick={() => setSelectedCommit(commit)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{commit.message}</p>
                      </div>
                      <code className="text-xs text-muted font-mono ml-3 flex-shrink-0">
                        {commit.sha.substring(0, 7)}
                      </code>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-muted">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{commit.author.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(commit.date)}</span>
                      </div>
                    </div>

                    {/* Branch Tags */}
                    {commit.branches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {commit.branches.map((branchName) => (
                          <span
                            key={branchName}
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `${getBranchColor(branchName)}20`,
                              color: getBranchColor(branchName),
                              border: `1px solid ${getBranchColor(branchName)}40`,
                            }}
                          >
                            <GitBranch className="w-3 h-3 inline mr-1" />
                            {branchName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Commit Details Modal */}
      {selectedCommit && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedCommit(null)}
        >
          <div
            className="glass p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Commit Details</h3>
              <button
                onClick={() => setSelectedCommit(null)}
                className="p-1 hover:bg-surface rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted">Message</label>
                <p className="text-sm font-medium mt-1">{selectedCommit.message}</p>
                {selectedCommit.body && (
                  <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{selectedCommit.body}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted">Author</label>
                  <p className="text-sm mt-1">{selectedCommit.author.name}</p>
                  <p className="text-xs text-muted">{selectedCommit.author.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted">Date</label>
                  <p className="text-sm mt-1">{new Date(selectedCommit.date).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted">SHA</label>
                <code className="text-sm font-mono block mt-1 bg-surface px-2 py-1 rounded">
                  {selectedCommit.sha}
                </code>
              </div>

              {selectedCommit.parents && selectedCommit.parents.length > 0 && (
                <div>
                  <label className="text-xs text-muted">Parent Commits</label>
                  <div className="space-y-1 mt-1">
                    {selectedCommit.parents.map((parent) => (
                      <code
                        key={parent}
                        className="text-sm font-mono block bg-surface px-2 py-1 rounded"
                      >
                        {parent}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
