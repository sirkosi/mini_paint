import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base URL for GitHub Pages - always use this for production
  // GitHub Pages URL format: https://<username>.github.io/<repo-name>/
  base: '/mini_paint/',

  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for debugging
    sourcemap: true,

    // Optimize for production
    minify: 'esbuild',

    // Target modern browsers
    target: 'esnext',

    // Copy service worker and manifest to root of dist
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },

  // Ensure public files (including sw.js and manifest.json) are copied
  publicDir: 'public',
});