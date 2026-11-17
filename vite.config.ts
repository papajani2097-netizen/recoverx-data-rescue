import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPagesBuild ? '/recoverx-data-rescue/' : '/',
  plugins: [react()],
  ssr: {
    noExternal: ['react-router', 'react-router-dom']
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true
  }
});
