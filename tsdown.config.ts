import { defineConfig } from 'tsdown';

export default defineConfig([{
  format: 'esm',
  entry: ['./src/index.ts'],
  outDir: './dist/esm',
  tsconfig: './tsconfig.json',
  fixedExtension: false,
  outputOptions: {
    comments: {
      jsdoc: false,
    },
  },
}, {
  format: 'cjs',
  entry: 'src/index.ts',
  outDir: './dist/cjs',
  tsconfig: './tsconfig-cjs.json',
  outExtensions() {
    return { js: '.js' }
  },
  outputOptions: {
    comments: {
      jsdoc: false,
    },
  },
}, {
  format: 'umd',
  platform: 'neutral',
  target: 'es2016',
  outDir: './dist/umd',
  entry: './src/index.ts',
  globalName: 'rationalize',
  tsconfig: './tsconfig.json',
  deps: {
    alwaysBundle: ['@lvlte/ulp'],
    onlyBundle: ['@lvlte/ulp'],
  },
  outputOptions: {
    entryFileNames: 'rationalize.js'
  }
}, {
  format: 'umd',
  platform: 'neutral',
  target: 'es2016',
  outDir: './dist/umd',
  entry: './src/index.ts',
  globalName: 'rationalize',
  minify: true,
  sourcemap: true,
  deps: {
    alwaysBundle: ['@lvlte/ulp'],
    onlyBundle: ['@lvlte/ulp'],
  },
  outputOptions: {
    entryFileNames: 'rationalize.min.js'
  }
}]);
