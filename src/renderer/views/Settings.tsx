import React from 'react';
import { Settings as SettingsIcon, Palette, Info, Check } from 'lucide-react';
import { useAppStore } from '../stores/app';

export const Settings: React.FC = () => {
  const [theme, setThemeState] = useAppStore((state) => [state.theme, state.setTheme]);
  const [appVersion, setAppVersion] = React.useState('0.1.0');

  React.useEffect(() => {
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    if (window.api) {
      const version = await window.api.app.getVersion();
      setAppVersion(version);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    // Apply theme to document
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
  };

  const themes = [
    { id: 'dark', name: 'Dark', description: 'Futuristic dark theme' },
    { id: 'light', name: 'Light', description: 'Coming soon...' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Draggable title bar region */}
      <div className="h-10 draggable" />
      
      {/* Header */}
      <header className="h-16 glass border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <SettingsIcon className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          
          {/* Theme Section */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            
            <div className="glass p-6 rounded-lg">
              <h3 className="text-sm font-medium mb-4 text-muted">Theme</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeChange(themeOption.id as 'dark' | 'light')}
                    disabled={themeOption.id === 'light'}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${theme === themeOption.id 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent/50 bg-surface'
                      }
                      ${themeOption.id === 'light' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{themeOption.name}</h4>
                        <p className="text-xs text-muted mt-1">{themeOption.description}</p>
                      </div>
                      {theme === themeOption.id && (
                        <Check className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    
                    {/* Theme Preview */}
                    <div className="mt-3 h-16 rounded border border-border overflow-hidden">
                      {themeOption.id === 'dark' ? (
                        <div className="h-full bg-[#0a0e14] flex items-center justify-center">
                          <div className="w-8 h-8 rounded bg-[#00d4ff] opacity-50"></div>
                        </div>
                      ) : (
                        <div className="h-full bg-gray-100 flex items-center justify-center">
                          <div className="w-8 h-8 rounded bg-blue-500 opacity-50"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold">About</h2>
            </div>
            
            <div className="glass p-6 rounded-lg space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                  🌙
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gradient">GitMoon</h3>
                  <p className="text-sm text-muted">Offline-first Git client</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Version</span>
                  <span className="font-mono">{appVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Built with</span>
                  <span>Electron + React + TypeScript</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Git wrapper</span>
                  <span>dugite</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted mb-3">
                  A desktop Git client that works offline with a futuristic dark theme. 
                  Manage repositories, compare branches, visualize commit history, and automate workflows.
                </p>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.api?.app.openPath('https://github.com')}
                    className="px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg text-sm transition-colors"
                  >
                    View on GitHub
                  </button>
                  <button
                    onClick={() => window.api?.app.openPath('https://github.com')}
                    className="px-4 py-2 bg-surface hover:bg-surface-elevated rounded-lg text-sm transition-colors"
                  >
                    Report Issue
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4 text-center text-xs text-muted">
                <p>Made with ❤️ by developers, for developers</p>
                <p className="mt-1">© 2026 GitMoon. Licensed under MIT.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
