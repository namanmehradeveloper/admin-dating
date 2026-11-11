// Vite config for the admin panel. The admin app calls the Express API directly at VITE_API_URL
// (no Vite proxy). Backend CORS must allow this origin via ADMIN_URL / WEB_URL / CLIENT_URL.

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
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
