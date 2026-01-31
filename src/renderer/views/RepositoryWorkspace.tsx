import React from 'react';
import { useRepositoryStore } from '../stores/repository';
import { useAppStore } from '../stores/app';
import { Overview } from './workspace/Overview';
import { Branches } from './workspace/Branches';
import { BranchDetails } from './workspace/BranchDetails';
import { Commits } from './workspace/Commits';
import { Changes } from './workspace/Changes';
import { Compare } from './workspace/Compare';
import { Graph } from './workspace/Graph';
import type { Branch } from '@shared/types/git';

export const RepositoryWorkspace: React.FC = () => {
  const selectedRepo = useRepositoryStore((state) => state.selectedRepo);
  const activeView = useAppStore((state) => state.activeView);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null);

  if (!selectedRepo) {
    return null;
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <Overview repository={selectedRepo} />;
      case 'branches':
        return selectedBranch ? (
          <BranchDetails 
            repository={selectedRepo} 
            branch={selectedBranch}
            onBack={() => setSelectedBranch(null)}
          />
        ) : (
          <Branches 
            repository={selectedRepo}
            onSelectBranch={(branch) => setSelectedBranch(branch)}
          />
        );
      case 'commits':
        return <Commits repository={selectedRepo} />;
      case 'changes':
        return <Changes repository={selectedRepo} />;
      case 'compare':
        return <Compare repository={selectedRepo} />;
      case 'graph':
        return <Graph repository={selectedRepo} />;
      default:
        return <Overview repository={selectedRepo} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Draggable title bar region */}
      <div className="h-10 draggable" />
      
      {/* Top Bar */}
      <header className="h-16 glass border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">{selectedRepo.name}</h1>
          <span className="text-sm text-muted">/ {selectedRepo.currentBranch}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-1 bg-surface rounded text-accent">
            {selectedRepo.provider}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
};
