import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Note: If deploying to a user site (username.github.io), use '/'.
    // If deploying to a project site (username.github.io/repo-name), change this to '/repo-name/'.
    base: './', 
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent crash if process is accessed elsewhere. 
      // Replaces process.env with an empty object to prevent leaking env vars or syntax errors.
      'process.env': JSON.stringify({})
    }
  };
});