import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url'; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // FIX: Mappar aliaset '@' till roten av applikationsmappen (./aura/)
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  }
});