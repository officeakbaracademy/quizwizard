import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Reads .env and .env.local, including names without the VITE_ prefix.
  // Those (like API_TOKEN) stay on this dev server and never reach the browser.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Lets a shared tunnel link (ngrok or Cloudflare) open this dev server.
      allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.trycloudflare.com'],
      // Proxy is only used once VITE_API_BASE_URL points at a relative path
      // like "/api/v1". Set VITE_API_TARGET to the backend origin to enable it.
      // The proxy adds the token here, so it is not in the browser's code.
      proxy: env.VITE_API_TARGET
        ? {
            '/api': {
              target: env.VITE_API_TARGET,
              changeOrigin: true,
              headers: {
                // Stops ngrok answering with its warning page.
                'ngrok-skip-browser-warning': '1',
                ...(env.API_TOKEN ? { Authorization: `Bearer ${env.API_TOKEN}` } : {}),
              },
            },
          }
        : undefined,
    },
  };
});
