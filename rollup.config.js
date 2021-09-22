import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import shim from 'rollup-plugin-shim';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import worker from 'rollup-plugin-worker-factory';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

import GL from '@luma.gl/constants';

const usedGlConstantKeys = [
  'FLOAT',
  'RGBA',
  'LUMINANCE_ALPHA',
  'LINEAR',
  'TEXTURE_MAG_FILTER',
  'TEXTURE_MIN_FILTER',
  'TEXTURE_WRAP_S',
  'TEXTURE_WRAP_T',
  'REPEAT',
  'CLAMP_TO_EDGE',
  'RG32F',
  'R32F',
];
const glConstants = Object.fromEntries(Array.from(Object.entries(GL)).filter(([key]) => usedGlConstantKeys.includes(key)));

function bundle(format, filename, options = {}) {
  return {
    input: 'src/index.js',
    output: {
      file: filename,
      format: format,
      name: 'WeatherLayers',
      sourcemap: true,
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/extensions': 'deck',
        '@deck.gl/layers': 'deck',
        '@luma.gl/core': 'luma',
        'geotiff': 'GeoTIFF',
      },
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
      ...(!options.resolve ? [
        ...Object.keys(pkg.dependencies),
        '@babel/runtime/helpers/defineProperty',
        'rollup-plugin-worker-factory/src/universal.js',
      ] : []),
    ],
    plugins: [
      shim({
        '@luma.gl/constants': `export default ${JSON.stringify(glConstants)}`,
        'color-name': 'export default {}'
      }),
      ...(options.resolve ? [resolve()] : []),
      commonjs(),
      babel({ babelHelpers: 'runtime' }),
      worker({ plugins: [resolve(), commonjs()] }),
      postcss({ plugins: [autoprefixer(), assets()] }),
      ...(options.minimize ? [terser()] : []),
      ...(options.stats ? [visualizer({
        filename: filename + '.stats.html',
      })] : []),
    ],
  };
}

export default [
  bundle('cjs', pkg.main),
  bundle('es', pkg.module),
  bundle('umd', pkg.browser.replace('.min', ''), { resolve: true, stats: true }),
  bundle('umd', pkg.browser, { resolve: true, minimize: true }),
];
