// Vite config for the admin panel. The admin app calls the Express API directly at VITE_API_URL,
// and the API allows this origin through CORS. The proxy below serves public/test-app.html, which
// calls the backend on its own origin so one ngrok tunnel to port 5173 is enough.

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const BACKEND_URL = 'http://127.0.0.1:5050';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
    proxy: {
      '/api': BACKEND_URL,
      '/uploads': BACKEND_URL,
      '/socket.io': { target: BACKEND_URL, ws: true },
    },
    watch: { ignored: ['**/backend/**'] },
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
