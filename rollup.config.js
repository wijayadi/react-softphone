import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import esbuild from 'rollup-plugin-esbuild'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import terser from '@rollup/plugin-terser'

import pkg from './package.json' with { type: 'json' }

// MUI ships every module with a `"use client"` directive. That directive only
// has meaning inside a framework that understands it (Next.js App Router); once
// bundled it is meaningless and Rollup warns with MODULE_LEVEL_DIRECTIVE.
// Strip it so the published output is framework-agnostic and the build is clean.
const stripModuleDirectives = () => ({
  name: 'strip-module-directives',
  transform(code) {
    if (!code || code.indexOf('use client') === -1) {
      return null
    }
    const stripped = code.replace(/^[ \t]*(['"])use client\1;?[ \t]*\r?\n/gm, '')
    if (stripped === code) {
      return null
    }
    return { code: stripped, map: null }
  }
})

export default {
  input: 'src/index.jsx',
  external: (id) => {
    // Only React and ReactDOM as external - bundle everything else including ALL MUI
    if (id === 'react' || id === 'react-dom' || id === 'react/jsx-runtime') {
      return true;
    }
    // Ensure MUI packages are NOT external (should be bundled)
    if (id.startsWith('@mui/') || id.startsWith('@emotion/')) {
      return false;
    }
    return false;
  },
  // Never fail the build on harmless module-level directives (belt & braces
  // with the stripping plugin above), and keep third-party-only noise (jssip
  // has unavoidable circular dependencies) out of the build log.
  onwarn(warning, warn) {
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
      warning.code === 'CIRCULAR_DEPENDENCY' ||
      warning.code === 'SOURCEMAP_ERROR'
    ) {
      return;
    }
    warn(warning);
  },
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    stripModuleDirectives(),
    json(),
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      preferBuiltins: false,
      browser: true
    }),
    commonjs({
      include: /node_modules/
    }),
    esbuild({
      target: 'es2018',
      jsx: 'automatic',
      jsxImportSource: 'react'
    }),
    terser()
  ]
}
