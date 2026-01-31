# GitMoon Architecture

## System Overview

GitMoon is an offline-first, desktop git client built on Electron with a React-based UI. The architecture prioritizes local-first operations with optional online enhancements.

```
┌─────────────────────────────────────────────────────────┐
│                     Main Process                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Git Engine │  │ File Watcher │  │  IPC Handlers   │ │
│  │  (dugite)  │  │  (chokidar)  │  │                 │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Local Cache (SQLite/IndexedDB)           │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                   Renderer Process                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │              React Application                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │ │
│  │  │ Views    │  │ Components│  │  State (Zustand)│  │ │
│  │  └──────────┘  └──────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Process Separation

### Main Process
**Responsibilities:**
- Git operations via dugite
- File system watching
- Local cache management
- Network detection
- Window management
- IPC message handling

**Key Modules:**
- `src/main/git/` - Git operation wrappers
- `src/main/ipc/` - IPC handlers
- `src/main/cache/` - Data persistence
- `src/main/watchers/` - File system watchers
- `src/main/network/` - Connection status

### Renderer Process
**Responsibilities:**
- UI rendering
- User interactions
- State management
- Command palette
- Keyboard shortcuts

**Key Modules:**
- `src/renderer/components/` - React components
- `src/renderer/views/` - Full page views
- `src/renderer/stores/` - Zustand stores
- `src/renderer/hooks/` - Custom React hooks
- `src/renderer/utils/` - Helper functions

### Preload Script
**Responsibilities:**
- Expose safe IPC API to renderer
- Type-safe communication bridge
- Security boundary

## Data Flow

### Repository Selection Flow
```
User clicks repo card
    ↓
Renderer updates selected repo state (Zustand)
    ↓
IPC: request repository details
    ↓
Main: fetch from cache or read git metadata
    ↓
IPC: return repository data
    ↓
Renderer: update UI with repo context
    ↓
Sidebar switches to repo-specific actions
```

### Git Operation Flow
```
User clicks "View Commits"
    ↓
Renderer: IPC call getCommitHistory(repoPath, limit)
    ↓
Main: Check cache for recent commits
    ↓
Main: Execute dugite.log() if needed
    ↓
Main: Parse git output
    ↓
Main: Save to cache
    ↓
Main: Return commit data via IPC
    ↓
Renderer: Display commits in virtualized list
```

### Offline/Online Transition
```
Network status changes
    ↓
Main: Detect via network monitoring
    ↓
IPC: Broadcast connection status
    ↓
Renderer: Update connection indicator
    ↓
Renderer: Enable/disable online features
    ↓
If online: Background sync remote refs
```

## Repository Context System

The UI adapts based on the currently selected repository:

### No Repository Selected
- Show repository management view
- Sidebar: [Home] [Recent] [Favorites] [Settings]
- Main area: Repository cards grid

### Repository Selected
- Show repository workspace view
- Sidebar: [← Back] [Overview] [Branches] [Commits] [Changes] [Compare] [Graph]
- Main area: Context-specific view
- Bottom panel: Commit details or terminal

## Offline-First Cache Strategy

### Immutable Data (Never Expires)
- Commit objects (SHA, message, author, date)
- File content at specific commits
- Blame information

### Mutable Data (Short TTL)
- Remote branch refs (5 min TTL)
- Uncommitted changes (real-time via file watcher)
- Repository stats (15 min TTL)

### Online-Only Data (Cached with TTL)
- Pull requests (10 min TTL)
- CI/CD status (5 min TTL)
- Issue links (30 min TTL)
- Contributor avatars (24 hour TTL)

### Cache Invalidation
- Manual: User triggers refresh
- Automatic: TTL expiration
- Event-driven: File system changes
- Network-driven: Connection restoration

## Provider Abstraction

Support for multiple git hosting providers:

```typescript
interface GitProvider {
  name: 'github' | 'gitlab' | 'bitbucket' | 'generic';
  authenticate(): Promise<void>;
  fetchPullRequests(repo: string): Promise<PullRequest[]>;
  fetchIssues(repo: string): Promise<Issue[]>;
  createPullRequest(data: PRData): Promise<PullRequest>;
}
```

Each provider implements the interface with platform-specific API calls.

## Security Model

### IPC Security
- Whitelist allowed IPC channels
- Validate all messages
- Sanitize git command inputs
- No shell execution of unsanitized strings

### Credential Storage
- Never store tokens in localStorage
- Use electron-store with encryption
- Prefer system keychain (keytar)
- Clear credentials on logout

### Content Security Policy
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.github.com https://gitlab.com;
```

## Performance Optimizations

### Rendering
- Virtual scrolling for commit lists (react-window)
- Code splitting for Monaco Editor
- Lazy loading of views
- Memoization of expensive computations

### Git Operations
- Pagination (50-100 commits per page)
- Incremental loading
- Background processing
- Debounced file watching

### Caching
- LRU cache for frequently accessed data
- Pre-fetch on repository selection
- Background sync during idle time
- Aggressive caching of immutable data

## Error Handling Strategy

### User-Facing Errors
- Toast notifications for non-critical errors
- Modal dialogs for blocking errors
- Inline error states in UI components
- Retry mechanisms with exponential backoff

### Internal Errors
- Comprehensive logging to file
- Sentry integration for crash reporting
- Detailed error context
- Stack traces in development mode

## Future Extensibility

### Plugin System (Phase 3)
- Custom views
- Additional git providers
- Workflow automation
- Theme extensions

### Multi-Repository View (Phase 2)
- Split screen with multiple repos
- Cross-repository operations
- Workspace grouping
- Shared settings

### Advanced Features (Phase 3)
- Git LFS support
- Submodule visualization
- Advanced merge strategies
- Custom diff algorithms
