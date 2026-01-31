import React from 'react';
import { X, Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import type { Repository } from '@shared/types/git';
import type { AutomationScript, AutomationStep, AutomationStepType, AutomationStepConfig } from '@shared/types/automation';
import { useAutomationStore } from '../../stores/automation';

interface ScriptModalProps {
  repository: Repository;
  script: AutomationScript | null; // null for creating new script
  onClose: () => void;
  onSave: () => void;
}

const STEP_TYPES: { value: AutomationStepType; label: string; requiresBranch?: boolean; requiresMessage?: boolean }[] = [
  { value: 'switch', label: 'Switch Branch', requiresBranch: true },
  { value: 'checkout', label: 'Checkout Branch', requiresBranch: true },
  { value: 'pull', label: 'Pull from Remote' },
  { value: 'push', label: 'Push to Remote' },
  { value: 'fetch', label: 'Fetch from Remote' },
  { value: 'merge', label: 'Merge Branch', requiresBranch: true },
  { value: 'commit', label: 'Commit Changes', requiresMessage: true },
  { value: 'stageAll', label: 'Stage All Changes' },
];

export const ScriptModal: React.FC<ScriptModalProps> = ({ repository, script, onClose, onSave }) => {
  const { createScript, updateScriptData } = useAutomationStore();
  const [branches, setBranches] = React.useState<string[]>([]);
  
  // Form state
  const [name, setName] = React.useState(script?.name || '');
  const [description, setDescription] = React.useState(script?.description || '');
  const [enabled, setEnabled] = React.useState(script?.enabled ?? true);
  const [steps, setSteps] = React.useState<AutomationStep[]>(
    script?.steps || []
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    loadBranches();
  }, [repository.path]);

  const loadBranches = async () => {
    try {
      const result = await window.api.git.getBranches(repository.path);
      if (result.success) {
        setBranches(result.data.map(b => b.name));
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleAddStep = () => {
    if (steps.length >= 20) {
      alert('Maximum 20 steps allowed per script');
      return;
    }

    const newStep: AutomationStep = {
      id: Date.now().toString(),
      type: 'switch',
      config: {},
      continueOnError: false,
    };

    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const handleUpdateStep = (stepId: string, updates: Partial<AutomationStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleUpdateStepConfig = (stepId: string, configUpdates: Partial<AutomationStepConfig>) => {
    setSteps(steps.map((s) => 
      s.id === stepId 
        ? { ...s, config: { ...s.config, ...configUpdates } } 
        : s
    ));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a script name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepType = STEP_TYPES.find((t) => t.value === step.type);

      if (stepType?.requiresBranch && !step.config.branch) {
        alert(`Step ${i + 1} (${stepType.label}) requires a branch name`);
        return;
      }

      if (stepType?.requiresMessage && !step.config.message) {
        alert(`Step ${i + 1} (${stepType.label}) requires a commit message`);
        return;
      }
    }

    setSaving(true);
    try {
      const scriptData: AutomationScript = {
        id: script?.id || Date.now().toString(),
        repositoryId: repository.id,
        name: name.trim(),
        description: description.trim() || undefined,
        steps,
        enabled,
        createdAt: script?.createdAt || new Date().toISOString(),
        lastRun: script?.lastRun,
      };

      const success = script
        ? await updateScriptData(scriptData)
        : await createScript(scriptData);

      if (success) {
        onSave();
      } else {
        alert('Failed to save script');
      }
    } catch (error) {
      console.error('Failed to save script:', error);
      alert('Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-[90vw] max-w-4xl h-[85vh] glass rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">
              {script ? 'Edit Automation Script' : 'Create Automation Script'}
            </h2>
            <p className="text-sm text-muted">{repository.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Script Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Script Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Release to Main"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this script does..."
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg resize-none focus:outline-none focus:border-accent transition-colors"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="enabled" className="text-sm cursor-pointer">
                Enable script (can be executed)
              </label>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Steps ({steps.length}/20)
              </h3>
              <button
                onClick={handleAddStep}
                disabled={steps.length >= 20}
                className="flex items-center space-x-2 px-3 py-1.5 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p>No steps yet. Click "Add Step" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <StepEditor
                    key={step.id}
                    step={step}
                    index={index}
                    totalSteps={steps.length}
                    branches={branches}
                    onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                    onUpdateConfig={(configUpdates) => handleUpdateStepConfig(step.id, configUpdates)}
                    onRemove={() => handleRemoveStep(step.id)}
                    onMove={handleMoveStep}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || steps.length === 0}
            className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : script ? 'Update Script' : 'Create Script'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Editor Component
interface StepEditorProps {
  step: AutomationStep;
  index: number;
  totalSteps: number;
  branches: string[];
  onUpdate: (updates: Partial<AutomationStep>) => void;
  onUpdateConfig: (configUpdates: Partial<AutomationStepConfig>) => void;
  onRemove: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

const StepEditor: React.FC<StepEditorProps> = ({
  step,
  index,
  totalSteps,
  branches,
  onUpdate,
  onUpdateConfig,
  onRemove,
  onMove,
}) => {
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const branchDropdownRef = React.useRef<HTMLDivElement>(null);

  const stepTypeInfo = STEP_TYPES.find((t) => t.value === step.type);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-start space-x-2 p-3 bg-surface border border-border rounded-lg">
      {/* Move Buttons */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="p-1 hover:bg-surface-elevated rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <GripVertical className="w-4 h-4 rotate-90 transform scale-x-[-1]" />
        </button>
        <button
          onClick={() => onMove(index, 'down')}
          disabled={index === totalSteps - 1}
          className="p-1 hover:bg-surface-elevated rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <GripVertical className="w-4 h-4 rotate-90" />
        </button>
      </div>

      {/* Step Number */}
      <div className="flex items-center justify-center w-8 h-8 bg-accent/20 text-accent rounded-full font-semibold text-sm flex-shrink-0">
        {index + 1}
      </div>

      {/* Step Config */}
      <div className="flex-1 space-y-2">
        {/* Step Type Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg hover:border-accent transition-colors text-left"
          >
            <span className="font-medium">{stepTypeInfo?.label || step.type}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 glass border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar">
              {STEP_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    onUpdate({ type: type.value, config: {} });
                    setShowTypeDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-surface-elevated transition-colors"
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch Input (for checkout and merge) */}
        {stepTypeInfo?.requiresBranch && (
          <div className="relative" ref={branchDropdownRef}>
            <input
              type="text"
              value={step.config.branch || ''}
              onChange={(e) => onUpdateConfig({ branch: e.target.value })}
              onFocus={() => setShowBranchDropdown(true)}
              placeholder="Enter or select branch..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors text-sm"
            />

            {showBranchDropdown && branches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto custom-scrollbar">
                {branches
                  .filter((b) =>
                    b.toLowerCase().includes((step.config.branch || '').toLowerCase())
                  )
                  .map((branch) => (
                    <button
                      key={branch}
                      onClick={() => {
                        onUpdateConfig({ branch });
                        setShowBranchDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-surface-elevated transition-colors text-sm"
                    >
                      {branch}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Commit Message Input */}
        {stepTypeInfo?.requiresMessage && (
          <input
            type="text"
            value={step.config.message || ''}
            onChange={(e) => onUpdateConfig({ message: e.target.value })}
            placeholder="Commit message..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent transition-colors text-sm"
          />
        )}

        {/* Continue on Error */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`continue-${step.id}`}
            checked={step.continueOnError}
            onChange={(e) => onUpdate({ continueOnError: e.target.checked })}
            className="w-3 h-3 accent-accent"
          />
          <label htmlFor={`continue-${step.id}`} className="text-xs text-muted cursor-pointer">
            Continue on error
          </label>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex-shrink-0"
        title="Remove step"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
