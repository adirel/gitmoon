import React from 'react';
import './styles/globals.css';
import { useAppStore } from './stores/app';
import { useRepositoryStore } from './stores/repository';
import { Sidebar } from './components/Sidebar';
import { RepositoryManagement } from './views/RepositoryManagement';
import { RepositoryWorkspace } from './views/RepositoryWorkspace';

export const App: React.FC = () => {
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);

  React.useEffect(() => {
    // Check if API is available
    if (!window.api) {
      console.error('❌ Electron API not available. Preload script may have failed to load.');
      return;
    }

    console.log('✅ Electron API loaded successfully!');
    console.log('Available API methods:', Object.keys(window.api));

    // Setup network status listener
    window.api.network.onStatusChanged((status) => {
      setConnectionStatus(status);
    });

    // Initial connection check
    window.api.network.checkStatus().then((result) => {
      if (result.success) {
        setConnectionStatus(result.data);
      }
    });

    // Load repositories
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    if (!window.api) return;
    
    const result = await window.api.repository.getAll();
    if (result.success) {
      useRepositoryStore.getState().setRepositories(result.data);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {selectedRepo ? <RepositoryWorkspace /> : <RepositoryManagement />}
      </main>
    </div>
  );
};
