import type { API } from '../preload';

declare global {
  interface Window {
    api: API;
  }
}

export {};
