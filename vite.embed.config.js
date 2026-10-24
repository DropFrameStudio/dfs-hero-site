// Builds the embeddable room into docs/ (GitHub Pages can serve that folder directly):
//   docs/dfs-hero.js, docs/dfs-hero.css + the model, decoders and textures next to them.
// Run with: npm run build:embed
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __DFS_EMBED__: true,
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    // Fixed file names (no hashes) so the Webflow embed URL never has to change
    rollupOptions: {
      input: 'src/embed.jsx',
      output: {
        format: 'es',
        inlineDynamicImports: true,
        entryFileNames: 'dfs-hero.js',
        assetFileNames: 'dfs-hero.[ext]',
      },
    },
  },
})
