import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
//
// `react-softphone` is loaded from the local component SOURCE (../../src),
// not from the copied/built package in node_modules. This keeps the example in
// sync with the component at all times (instant HMR, no rebuild needed, and no
// stale Vite dependency-pre-bundle cache).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-softphone': path.resolve(dirname, '../../src/index.jsx'),
    },
    // Ensure the component and the app share a single React instance.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Never pre-bundle the component; serve it straight from source.
    exclude: ['react-softphone'],
  },
  server: {
    // Allow importing source files that live outside this example directory.
    fs: {
      allow: [path.resolve(dirname, '../..')],
    },
  },
})
