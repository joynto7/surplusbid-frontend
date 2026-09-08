import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Matches surplusbid-backend's default CORS_ORIGIN (http://localhost:3000)
    // so the API's CORS check and the Google OAuth redirect work out of the box.
    port: 3000,
  },
});
