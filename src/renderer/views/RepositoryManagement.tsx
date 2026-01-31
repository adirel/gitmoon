import React from 'react';
import { Plus, Search, FolderGit2 } from 'lucide-react';
import { useRepositoryStore } from '../stores/repository';
import { RepositoryCard } from '../components/repository/RepositoryCard';

export const RepositoryManagement: React.FC = () => {
  const repositories = useRepositoryStore((state) => state.repositories);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleAddRepository = async () => {
    if (!window.api) {
      console.error('API not available');
      return;
    }

    // Open a file dialog using Electron's dialog API
    const result = await window.api.app.selectFolder();
    if (result.success && result.data) {
      try {
        // Get the current branch
        const branchesResult = await window.api.git.getBranches(result.data.path);
        const currentBranch = branchesResult.success 
          ? branchesResult.data.find(b => !b.isRemote)?.name || 'main'
          : 'main';

        // Get the remote URL
        const remoteResult = await window.api.git.getRemoteUrl(result.data.path);
        const remoteUrl = remoteResult.success ? remoteResult.data : undefined;

        // Determine provider from remote URL
        let provider: 'github' | 'gitlab' | 'bitbucket' | 'generic' = 'generic';
        if (remoteUrl) {
          if (remoteUrl.includes('github.com')) provider = 'github';
          else if (remoteUrl.includes('gitlab.com')) provider = 'gitlab';
          else if (remoteUrl.includes('bitbucket.org')) provider = 'bitbucket';
        }

        // Add the repository
        const newRepo = {
          id: crypto.randomUUID(),
          name: result.data.name,
          path: result.data.path,
          provider: provider,
          currentBranch: currentBranch,
          remoteUrl: remoteUrl,
          lastSynced: undefined,
          isFavorite: false,
        };

        const addResult = await window.api.repository.add(newRepo);

        if (addResult.success) {
          // Reload repositories
          const repos = await window.api.repository.getAll();
          if (repos.success) {
            useRepositoryStore.getState().setRepositories(repos.data);
          }
        } else {
          console.error('Failed to add repository:', addResult.error);
        }
      } catch (error) {
        console.error('Error adding repository:', error);
      }
    }
  };

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Draggable title bar region */}
      <div className="h-10 draggable" />
      
      {/* Header */}
      <header className="h-16 glass border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gradient">GitMoon</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors w-64"
            />
          </div>
          
          <button 
            onClick={handleAddRepository}
            className="flex items-center space-x-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Repository</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredRepos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <FolderGit2 className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No repositories found</p>
            <p className="text-sm">Add a repository to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRepos.map((repo) => (
              <RepositoryCard key={repo.id} repository={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
