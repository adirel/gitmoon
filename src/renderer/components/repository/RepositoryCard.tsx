import React from 'react';
import { GitBranch, Clock, MoreVertical, Star, GitPullRequest, RefreshCw, Upload, Download } from 'lucide-react';
import { useRepositoryStore } from '../../stores/repository';
import type { Repository } from '@shared/types/git';
import { cn } from '../../utils/cn';

interface RepositoryCardProps {
  repository: Repository;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  const selectRepository = useRepositoryStore((state) => state.selectRepository);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleGitOperation = async (operation: 'fetch' | 'pull' | 'push' | 'sync', e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (!window.api || isLoading) return;
    
    setIsLoading(true);
    try {
      let result;
      switch (operation) {
        case 'fetch':
          result = await window.api.git.fetch(repository.path);
          break;
        case 'pull':
          result = await window.api.git.pull(repository.path);
          break;
        case 'push':
          result = await window.api.git.push(repository.path);
          break;
        case 'sync':
          // Sync = pull + push
          const pullResult = await window.api.git.pull(repository.path);
          if (pullResult.success) {
            result = await window.api.git.push(repository.path);
          } else {
            result = pullResult;
          }
          break;
      }

      if (result?.success) {
        console.log(`${operation} completed successfully`);
        // Update last synced time
        const updatedRepo = {
          ...repository,
          lastSynced: new Date().toISOString(),
        };
        await window.api.repository.update(updatedRepo);
      } else {
        console.error(`${operation} failed:`, result?.error);
      }
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'github':
        return 'text-accent';
      case 'gitlab':
        return 'text-orange-500';
      case 'bitbucket':
        return 'text-blue-500';
      default:
        return 'text-muted';
    }
  };

  return (
    <div
      onClick={() => selectRepository(repository.id)}
      className={cn(
        "glass p-4 rounded-lg hover:border-accent cursor-pointer transition-all duration-200 hover:shadow-glow group relative",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
            {repository.name}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-muted">
            <span className={cn('font-medium', getProviderColor(repository.provider))}>
              {repository.provider}
            </span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <GitBranch className="w-3 h-3" />
              <span>{repository.currentBranch}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2" ref={menuRef}>
          {repository.isFavorite && (
            <Star className="w-4 h-4 text-warning fill-warning" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-surface-elevated rounded transition-colors relative"
          >
            <MoreVertical className="w-4 h-4 text-muted" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 glass border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
              <button
                onClick={(e) => handleGitOperation('fetch', e)}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-surface-elevated transition-colors text-left text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Fetch</span>
              </button>
              <button
                onClick={(e) => handleGitOperation('pull', e)}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-surface-elevated transition-colors text-left text-sm"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>Pull</span>
              </button>
              <button
                onClick={(e) => handleGitOperation('push', e)}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-surface-elevated transition-colors text-left text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Push</span>
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={(e) => handleGitOperation('sync', e)}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-surface-elevated transition-colors text-left text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-muted">
          <Clock className="w-3 h-3" />
          <span>
            {repository.lastSynced
              ? `Synced ${getRelativeTime(repository.lastSynced)}`
              : 'Never synced'}
          </span>
        </div>
      </div>

      {/* Path */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted truncate" title={repository.path}>
          {repository.path}
        </p>
      </div>
    </div>
  );
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
