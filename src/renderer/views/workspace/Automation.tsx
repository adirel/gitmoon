import React from 'react';
import { Zap, Search, Plus, Play, Edit, Trash2, Clock, RefreshCw } from 'lucide-react';
import type { Repository } from '@shared/types/git';
import type { AutomationScript } from '@shared/types/automation';
import { useAutomationStore } from '../../stores/automation';
import { ScriptModal } from '../../components/automation/ScriptModal';
import { ExecutionModal } from '../../components/automation/ExecutionModal';

interface AutomationProps {
  repository: Repository;
}

export const Automation: React.FC<AutomationProps> = ({ repository }) => {
  const {
    scripts,
    isLoading,
    isExecuting,
    currentExecution,
    loadScripts,
    deleteScript,
    executeScript,
    setCurrentExecution,
  } = useAutomationStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showScriptModal, setShowScriptModal] = React.useState(false);
  const [editingScript, setEditingScript] = React.useState<AutomationScript | null>(null);
  const [showExecutionModal, setShowExecutionModal] = React.useState(false);

  React.useEffect(() => {
    if (repository) {
      loadScripts(repository.id);
    }
  }, [repository.id]);

  const handleCreateScript = () => {
    setEditingScript(null);
    setShowScriptModal(true);
  };

  const handleEditScript = (script: AutomationScript) => {
    setEditingScript(script);
    setShowScriptModal(true);
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (confirm('Are you sure you want to delete this automation script?')) {
      await deleteScript(scriptId);
    }
  };

  const handleExecuteScript = async (script: AutomationScript) => {
    if (!script.enabled) {
      alert('This script is disabled. Please enable it first.');
      return;
    }

    setShowExecutionModal(true);
    await executeScript(script.id, repository.path);
  };

  const handleCloseExecutionModal = () => {
    setShowExecutionModal(false);
    setCurrentExecution(null);
  };

  const filteredScripts = scripts.filter((script) =>
    script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Automation Scripts</h2>
            <span className="text-sm text-muted">({filteredScripts.length})</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadScripts(repository.id)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleCreateScript}
              className="flex items-center space-x-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Script</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search automation scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Script List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted">
            <Zap className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No automation scripts yet</p>
            <p className="text-sm mb-4">Create your first script to automate common git workflows</p>
            <button
              onClick={handleCreateScript}
              className="flex items-center space-x-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Script</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className={`glass border rounded-lg p-4 transition-all ${
                  script.enabled
                    ? 'border-border hover:border-accent'
                    : 'border-border opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold">{script.name}</h3>
                      {!script.enabled && (
                        <span className="text-xs px-2 py-0.5 bg-surface border border-border rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                    {script.description && (
                      <p className="text-sm text-muted">{script.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted mb-3">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>{script.steps.length} steps</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last run: {formatDate(script.lastRun)}</span>
                  </div>
                </div>

                {/* Step Preview */}
                <div className="mb-3 space-y-1">
                  {script.steps.slice(0, 3).map((step, index) => (
                    <div key={step.id} className="text-xs text-muted flex items-center space-x-2">
                      <span className="text-accent">{index + 1}.</span>
                      <span className="font-mono">{step.type}</span>
                      {step.config.branch && (
                        <span className="text-foreground">→ {step.config.branch}</span>
                      )}
                    </div>
                  ))}
                  {script.steps.length > 3 && (
                    <div className="text-xs text-muted">
                      +{script.steps.length - 3} more steps...
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-3 border-t border-border">
                  <button
                    onClick={() => handleExecuteScript(script)}
                    disabled={!script.enabled || isExecuting}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </button>

                  <button
                    onClick={() => handleEditScript(script)}
                    className="flex items-center justify-center px-3 py-2 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
                    title="Edit script"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteScript(script.id)}
                    className="flex items-center justify-center px-3 py-2 bg-surface hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showScriptModal && (
        <ScriptModal
          repository={repository}
          script={editingScript}
          onClose={() => {
            setShowScriptModal(false);
            setEditingScript(null);
          }}
          onSave={() => {
            setShowScriptModal(false);
            setEditingScript(null);
            loadScripts(repository.id);
          }}
        />
      )}

      {showExecutionModal && currentExecution && (
        <ExecutionModal
          execution={currentExecution}
          onClose={handleCloseExecutionModal}
        />
      )}
    </div>
  );
};
