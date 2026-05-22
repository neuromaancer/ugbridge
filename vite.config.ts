import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ttsPlugin } from './vite-plugins/tts';

export default defineConfig({
  plugins: [react(), ttsPlugin()],
});
