import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url'; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@google/genai',
        'recharts',
        'lucide-react',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore'
      ]
    }
  }
});