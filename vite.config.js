import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy is only used once VITE_API_BASE_URL points at a relative path
    // like "/api". Set VITE_API_TARGET to the backend origin to enable it.
    proxy: process.env.VITE_API_TARGET
      ? {
          '/api': {
            target: process.env.VITE_API_TARGET,
            changeOrigin: true,
          },
        }
      : undefined,
  },
});
