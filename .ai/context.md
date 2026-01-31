# GitMoon - Quick AI Context

## What is this project?
Offline-first desktop git client with futuristic UI. Electron + React + TypeScript. Think GitHub Desktop meets Linear's design aesthetic.

## Key Technologies
- **Electron** - Desktop app framework
- **React 18** - UI library with hooks
- **TypeScript** - Strict typing
- **Tailwind CSS** - Utility-first styling with dark theme
- **Shadcn/ui** - Component library (Radix + Tailwind)
- **Zustand** - State management
- **dugite** - Git operations wrapper
- **Monaco Editor** - Code/diff viewer

## Critical Principles
1. **Offline-first** - Everything works without network
2. **Repository context** - UI changes based on selected repo
3. **Main/renderer split** - Git ops in main, UI in renderer
4. **IPC for everything** - Secure communication between processes
5. **Cache aggressively** - Commits never change, cache forever

## File Locations

### Main Entry Points
- `src/main/index.ts` - Electron main process
- `src/renderer/App.tsx` - React root component
- `src/preload/index.ts` - IPC bridge

### Important Directories
- `src/main/git/` - Git operation wrappers
- `src/main/ipc/` - IPC message handlers
- `src/renderer/components/` - React UI components
- `src/renderer/views/` - Full page views
- `src/renderer/stores/` - Zustand state stores
- `src/shared/` - Types and constants shared between processes

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Design tokens
- `electron-builder.yml` - Build configuration

## Key Types

```typescript
interface Repository {
  id: string;
  name: string;
  path: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'generic';
  currentBranch: string;
  remoteUrl?: string;
}

interface Commit {
  sha: string;
  message: string;
  author: Author;
  date: Date;
  parents: string[];
  stats?: CommitStats;
}

interface Branch {
  name: string;
  sha: string;
  isRemote: boolean;
  upstream?: string;
}
```

## Common Patterns

### IPC Call (Renderer to Main)
```typescript
// Renderer
const commits = await window.api.git.getCommitHistory(repoPath, 50);

// Main handler
ipcMain.handle('git:getCommitHistory', async (event, repoPath, limit) => {
  const commits = await gitOperations.getCommitHistory(repoPath, limit);
  return commits;
});
```

### Git Operation
```typescript
// src/main/git/operations/commits.ts
export async function getCommitHistory(
  repoPath: string, 
  limit: number = 50
): Promise<Commit[]> {
  const result = await git(['log', `--max-count=${limit}`, '--format=%H|%an|%ae|%at|%s'], repoPath);
  return parseCommits(result.stdout);
}
```

### Component with Store
```typescript
import { useRepositoryStore } from '@/stores/repository';

export const RepoCard: React.FC = () => {
  const { selectedRepo, selectRepository } = useRepositoryStore();
  
  return (
    <div onClick={() => selectRepository(repo.id)}>
      {repo.name}
    </div>
  );
};
```

## Design Tokens (Tailwind)

```javascript
colors: {
  background: '#0a0e14',
  surface: '#1a1f2e',
  accent: '#00d4ff',
  'accent-purple': '#a78bfa',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
}
```

## Development Commands
- `npm run dev` - Start dev mode with hot reload
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run type-check` - TypeScript validation

## Where to Find Examples
- Simple component: `src/renderer/components/ui/Button.tsx`
- Complex view: `src/renderer/views/RepositoryManagement.tsx`
- Git operation: `src/main/git/operations/branches.ts`
- IPC handler: `src/main/ipc/handlers/git.ts`
- Custom hook: `src/renderer/hooks/useRepositoryData.ts`
- Zustand store: `src/renderer/stores/repository.ts`

## Common Tasks

**Add new git operation:**
1. Create in `src/main/git/operations/`
2. Add IPC handler in `src/main/ipc/handlers/git.ts`
3. Add channel in `src/shared/ipc-channels.ts`
4. Expose in preload `src/preload/index.ts`
5. Call from renderer via `window.api.git.operationName()`

**Add new view:**
1. Create component in `src/renderer/views/`
2. Add to sidebar navigation
3. Create associated store if needed
4. Add keyboard shortcut in command palette

## Gotchas
- Never block main thread with sync git operations
- Always sanitize git command inputs (security)
- Use virtual scrolling for long lists (performance)
- Check online status before network operations
- Cache commit data aggressively (immutable)
- Use Tailwind classes, avoid inline styles
- Keep components under 200 lines
