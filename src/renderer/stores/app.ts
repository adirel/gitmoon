import { create } from 'zustand';
import type { ConnectionStatus } from '@shared/types/git';

interface AppStore {
  connectionStatus: ConnectionStatus;
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  activeView: string;
  
  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setActiveView: (view: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  connectionStatus: {
    isOnline: true,
    lastChecked: new Date(),
  },
  theme: 'dark',
  sidebarCollapsed: false,
  activeView: 'home',

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveView: (view) => set({ activeView: view }),
}));
