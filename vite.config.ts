
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
        '@': fileURLToPath(new URL('./', import.meta.url))
      }
    },
    define: {
      // Ensure API_KEY falls back to empty string if undefined to avoid "process.env.API_KEY is undefined" crashes
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      // Polyfill process.env for other libraries if needed
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      // Removed rollupOptions.external to ensure all libraries are bundled correctly.
      // This fixes the ReactCurrentOwner error and module loading failures.
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'recharts', 'firebase/app', 'firebase/auth', 'firebase/firestore']
          }
        }
      }
    }
  };
});
