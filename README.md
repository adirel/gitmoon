# GitMoon 🌙

> Offline-first Git management UI client with a futuristic design

GitMoon is a modern desktop application for managing Git repositories with an emphasis on offline-first functionality, beautiful UI, and powerful branch comparison and diff viewing capabilities.

## ✨ Features

- 🔌 **Offline-First** - All core features work without internet
- 📊 **Branch Comparison** - Side-by-side branch and commit comparison
- 🎨 **Futuristic UI** - Dark theme with glassmorphism and neon accents
- 🚀 **Fast Performance** - Virtualized lists and optimized rendering
- 🔐 **Multi-Provider** - Support for GitHub, GitLab, Bitbucket
- ⌨️ **Keyboard-First** - Command palette and shortcuts for power users
- 🎯 **Repository Context** - UI adapts to the selected repository

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git installed on your system

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gitmoon.git
cd gitmoon

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Package for your platform
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## 🏗️ Project Structure

```
gitmoon/
├── src/
│   ├── main/              # Electron main process
│   │   ├── git/           # Git operations (dugite)
│   │   ├── ipc/           # IPC handlers
│   │   └── index.ts       # Main entry point
│   ├── renderer/          # React application
│   │   ├── components/    # UI components
│   │   ├── views/         # Page views
│   │   ├── stores/        # Zustand state
│   │   ├── hooks/         # Custom hooks
│   │   └── App.tsx        # React root
│   ├── preload/           # Electron preload scripts
│   └── shared/            # Shared types and constants
├── docs/                  # Documentation
└── .github/               # GitHub configs and Copilot instructions
```

## 🎨 Technology Stack

- **Electron** - Cross-platform desktop framework
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component library (Radix + Tailwind)
- **Zustand** - Lightweight state management
- **dugite** - Git CLI wrapper for reliable operations
- **Monaco Editor** - Code and diff viewer
- **Vite** - Fast build tool

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Coding Standards](docs/CODING_STANDARDS.md) - Code style and conventions
- [Copilot Instructions](.github/copilot-instructions.md) - AI assistant context

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - TypeScript validation
- `npm test` - Run tests
- `npm run format` - Format code with Prettier

### Code Style

We use ESLint and Prettier to maintain code quality. The project follows strict TypeScript configuration and React best practices.

### Git Workflow

- Create feature branches from `main`
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Submit PRs for review

## 🗺️ Roadmap

### Phase 1: Core Functionality (Current)
- [x] Project setup and architecture
- [ ] Repository management UI
- [ ] Basic git operations (commits, branches)
- [ ] Commit history viewer
- [ ] Branch comparison
- [ ] Diff viewer with Monaco Editor

### Phase 2: Enhanced Features
- [ ] Pull request viewing
- [ ] Conflict resolution UI
- [ ] Stash management
- [ ] Search and filters
- [ ] Multi-repository tabs

### Phase 3: Advanced Features
- [ ] Plugin system
- [ ] Custom themes
- [ ] Git LFS support
- [ ] Advanced merge strategies
- [ ] Workflow automation

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by GitHub Desktop, GitKraken, and Linear
- Built with amazing open-source tools
- UI design influenced by modern dev tools aesthetics

---

Made with ❤️ and futuristic vibes
