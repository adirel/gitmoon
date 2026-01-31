# GitMoon - Offline-First Git Management UI Client

## Project Overview
Desktop git client built with Electron + React + TypeScript.
Offline-first architecture with optional online sync for GitHub/GitLab/Bitbucket.

## Tech Stack
- **Framework**: Electron with TypeScript
- **Frontend**: React 18+ with functional components and hooks
- **UI Library**: Shadcn/ui (Radix + Tailwind CSS)
- **State**: Zustand for global state
- **Git Operations**: dugite (git CLI wrapper)
- **Styling**: Tailwind CSS with dark futuristic theme
- **Code Editor**: Monaco Editor for diffs
- **Icons**: Lucide React

## Architecture Principles
1. **Offline-First**: All core features work without network
2. **Repository Context**: UI adapts based on selected repository
3. **IPC Communication**: Main process handles git ops, renderer handles UI
4. **Cache Strategy**: SQLite/IndexedDB for offline data persistence
5. **Graceful Degradation**: Online features disabled when offline

## Code Patterns

### File Structure
- `src/main/` - Main process (Electron, git operations, IPC handlers)
- `src/renderer/` - Renderer process (React UI components)
- `src/shared/` - Shared types and constants
- `src/preload/` - Electron preload scripts (IPC bridge)

### Naming Conventions
- Components: PascalCase (e.g., `CommitList.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useRepositoryState.ts`)
- Utils: camelCase (e.g., `formatCommitMessage.ts`)
- Types: PascalCase with descriptive names (e.g., `RepositoryMetadata`)
- Git operations: camelCase verbs (e.g., `getBranchList()`)

### Component Structure
- Use functional components with TypeScript
- Props interface at top of file
- Extract complex logic to custom hooks
- Keep components under 200 lines (split if larger)
- Use composition over inheritance

### State Management
- Zustand stores for global state (repos, app settings)
- React Query for cache management (when online)
- Local state with useState for component-specific data
- Context API sparingly (theme, auth only)

### Git Operations
- All git ops in `src/main/git/` wrapped in async functions
- Return Result<T, Error> type for error handling
- Never block renderer process
- Cache immutable data (commits) aggressively
- Use file watchers for repo changes

### Error Handling
- Try-catch in all git operations
- User-friendly error messages (no raw git errors)
- Toast notifications for non-blocking errors
- Modal dialogs for critical errors requiring action
- Log all errors to file for debugging

### Offline Handling
- Check connection before online operations
- Disable UI elements when offline (not hide)
- Show clear "Requires connection" tooltips
- Cache all fetched data with timestamps
- Queue operations when offline (optional)

## UI/UX Guidelines

### Design Language
- **Theme**: Dark futuristic with glassmorphism
- **Colors**: Deep dark bg (#0a0e14), electric blue accent (#00d4ff)
- **Typography**: Inter for UI, JetBrains Mono for code
- **Spacing**: 8px base unit (use Tailwind spacing scale)
- **Animations**: 200ms ease-out transitions
- **Borders**: 8-12px rounded corners on panels

### Layout Patterns
- Collapsible icon sidebar (60-80px)
- Three-panel system: top bar, main content, bottom details
- Repository cards in grid layout (management screen)
- Resizable panels with neon dividers
- Command palette (Cmd/Ctrl+K) for quick actions

### Component Styling
- Use Tailwind utility classes (avoid custom CSS)
- Shadcn/ui components as base, customize with Tailwind
- Consistent hover states (glow effect)
- Loading: skeleton screens with shimmer
- Icons: Lucide React icon library

### Accessibility
- Keyboard navigation for all actions
- ARIA labels on interactive elements
- Focus visible styles (blue glow)
- Screen reader friendly status messages
- High contrast mode support

## Common Tasks

### Adding New Git Operation
1. Create function in `src/main/git/operations/`
2. Add IPC handler in `src/main/ipc/handlers.ts`
3. Add IPC channel constant in `src/shared/ipc-channels.ts`
4. Create preload bridge in `src/preload/index.ts`
5. Call from renderer via `window.api.git.operationName()`

### Adding New View
1. Create component in `src/renderer/components/views/`
2. Add route in sidebar navigation config
3. Update repository context to include new action
4. Add state management if needed (Zustand store)
5. Add keyboard shortcut in command palette

### Adding Offline-Capable Feature
1. Implement local-only version first
2. Add connection check before online operations
3. Cache results in local storage
4. Add UI indicator for offline state
5. Test with network disabled

## Testing Strategy
- Unit tests: Git operations, utilities, pure functions
- Integration tests: IPC communication, data flow
- E2E tests: Critical user flows (Playwright)
- Manual testing: Offline mode, large repos, error cases

## Performance Considerations
- Virtualize long lists (react-window)
- Debounce search and filter inputs (300ms)
- Lazy load Monaco Editor
- Paginate commit history (50-100 per page)
- Web workers for heavy parsing (large diffs)
- Memoize expensive computations (React.memo, useMemo)

## Security
- Sanitize all git command inputs
- Store tokens in system keychain (never plain text)
- Validate all IPC messages
- Content Security Policy in renderer
- No eval() or dangerous innerHTML

## Common Pitfalls to Avoid
- ❌ Don't use git commands without sanitizing input
- ❌ Don't block UI thread with synchronous operations
- ❌ Don't fetch all commits at once (paginate)
- ❌ Don't show raw git error messages to users
- ❌ Don't assume network is always available
- ❌ Don't store credentials in localStorage
- ❌ Don't use inline styles (use Tailwind)

## Development Commands
- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npm test` - Run tests
