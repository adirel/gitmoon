import React from 'react';
import { Home, Clock, Star, Settings, FolderGit2, GitBranch, GitCommit, FileText, GitCompare, Network, Zap, ChevronLeft } from 'lucide-react';
import { useRepositoryStore } from '../stores/repository';
import { useAppStore } from '../stores/app';
import { cn } from '../utils/cn';

export const Sidebar: React.FC = () => {
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);
  const selectRepository = useRepositoryStore((state) => state.selectRepository);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  const managementItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Clock, label: 'Recent', id: 'recent' },
    { icon: Star, label: 'Favorites', id: 'favorites' },
  ];

  const workspaceItems = [
    { icon: FolderGit2, label: 'Overview', id: 'overview' },
    { icon: GitBranch, label: 'Branches', id: 'branches' },
    { icon: GitCommit, label: 'Commits', id: 'commits' },
    { icon: FileText, label: 'Changes', id: 'changes' },
    { icon: GitCompare, label: 'Compare', id: 'compare' },
    { icon: Network, label: 'Graph', id: 'graph' },
    { icon: Zap, label: 'Automation', id: 'automation' },
  ];

  const items = selectedRepo ? workspaceItems : managementItems;

  React.useEffect(() => {
    if (selectedRepo) {
      setActiveView('overview');
    } else {
      setActiveView('home');
    }
  }, [selectedRepo, setActiveView]);

  const handleNavClick = (itemId: string) => {
    setActiveView(itemId);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full glass border-r border-border transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-20'
      )}
    >
      {/* Header */}
      <div className="h-10 flex items-center justify-center border-b border-border">
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            connectionStatus.isOnline ? 'bg-success shadow-glow-sm' : 'bg-muted'
          )}
          title={connectionStatus.isOnline ? 'Online' : 'Offline'}
        />
      </div>

      {/* Back button (when repo selected) */}
      {selectedRepo && (
        <button
          onClick={() => selectRepository(null)}
          className="flex items-center justify-center h-14 hover:bg-surface-elevated transition-colors group"
          title="Back to repositories"
        >
          <ChevronLeft className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
        </button>
      )}

      {/* Navigation items */}
      <nav className="flex-1 py-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "w-full h-14 flex items-center justify-center transition-colors group relative",
              activeView === item.id 
                ? "bg-surface-elevated border-l-2 border-accent" 
                : "hover:bg-surface-elevated"
            )}
            title={item.label}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeView === item.id ? "text-accent" : "text-muted group-hover:text-accent"
            )} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Settings at bottom (when no repo selected) */}
      {!selectedRepo && (
        <div className="border-t border-border">
          <button
            className="w-full h-14 flex items-center justify-center hover:bg-surface-elevated transition-colors group"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
          </button>
        </div>
      )}
    </aside>
  );
};
