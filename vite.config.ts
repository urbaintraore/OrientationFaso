import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

// A robust plugin to virtualize firebase-applet-config.json if it is missing (e.g., in a production/Vercel build where it is gitignored)
function virtualFirebaseConfig() {
  const virtualId = 'virtual:firebase-applet-config';
  return {
    name: 'virtual-firebase-config',
    resolveId(id: string, importer: string | undefined) {
      if (id.includes('firebase-applet-config.json') && importer) {
        const fullPath = path.resolve(path.dirname(importer), id);
        if (!fs.existsSync(fullPath)) {
          return virtualId;
        }
      }
      return null;
    },
    load(id: string) {
      if (id === virtualId) {
        return 'export default {};';
      }
      return null;
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), virtualFirebaseConfig()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
