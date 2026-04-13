import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'https://posbackend-ten.vercel.app' } },
  build: {
    sourcemap: false,
  },
});
