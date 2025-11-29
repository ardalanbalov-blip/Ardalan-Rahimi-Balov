
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url'; 

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      // Ensure API_KEY falls back to empty string if undefined to avoid "process.env.API_KEY is undefined" crashes
      // Checks env.API_KEY, env.VITE_GEMINI_API_KEY, then system env
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || process.env.API_KEY || ''),
      // Polyfill process.env for other libraries if needed
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          // Let Vite handle chunking automatically to prevent 404 errors on missing vendor chunks
        }
      }
    }
  };
});