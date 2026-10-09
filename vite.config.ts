import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// MUI ships every module with a `"use client"` directive. That directive only
// has meaning inside a framework that understands it (Next.js App Router); once
// bundled it is meaningless and Rollup warns with MODULE_LEVEL_DIRECTIVE.
// Strip it so the published output is framework-agnostic and the build is clean.
const stripModuleDirectives = () => ({
  name: 'strip-module-directives',
  transform(code: string) {
    if (!code || code.indexOf('use client') === -1) {
      return null;
    }
    const stripped = code.replace(/^[ \t]*(['"])use client\1;?[ \t]*\r?\n/gm, '');
    if (stripped === code) {
      return null;
    }
    return { code: stripped, map: null };
  }
});

// https://vite.dev/config/
//
// Library build: mirrors the previous Rollup setup (React external, everything
// else — including MUI — bundled) and emits the same public entry points:
//   - dist/index.es.js  (ES module)
//   - dist/index.js     (CommonJS)
export default defineConfig({
  plugins: [react(), stripModuleDirectives()],
  build: {
    target: 'es2018',
    sourcemap: true,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(dirname, 'src/index.tsx'),
      name: 'ReactSoftphone',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.es.js' : 'index.js')
    },
    rollupOptions: {
      // React and zustand are peer dependencies; bundle everything else
      // including ALL MUI.
      external: (id) =>
        id === 'react' ||
        id === 'react-dom' ||
        id === 'react/jsx-runtime' ||
        id === 'react/jsx-dev-runtime' ||
        id === 'zustand' ||
        id === 'zustand/vanilla' ||
        id.startsWith('zustand/'),
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
      // Never fail the build on harmless module-level directives (belt & braces
      // with the stripping plugin above), and keep third-party-only noise
      // (jssip has unavoidable circular dependencies) out of the build log.
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.code === 'CIRCULAR_DEPENDENCY' ||
          warning.code === 'SOURCEMAP_ERROR'
        ) {
          return;
        }
        warn(warning);
      }
    }
  }
});
