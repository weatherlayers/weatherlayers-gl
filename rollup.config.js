import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import shim from 'rollup-plugin-shim';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import glslify from 'rollup-plugin-glslify';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

/** @typedef { import('rollup').RollupOptions } RollupOptions */
/** @typedef { import('rollup').ModuleFormat } ModuleFormat */

/**
 * @param {ModuleFormat} format
 * @param {string} filename
 * @param {{ resolve?: boolean, minimize?: boolean, stats?: boolean }} options
 * @return {RollupOptions}
 */
function bundle(format, filename, options = {}) {
  return {
    input: 'src/index.js',
    output: {
      file: filename,
      format: format,
      name: 'MaritraceMapboxWeather',
      sourcemap: true,
      globals: {
        'mapboxgl': 'mapboxgl',
        'resize-observer-polyfill': 'ResizeObserver',
      },
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
      ...(!options.resolve ? [
        ...Object.keys(pkg.dependencies),
        '@babel/runtime/helpers/defineProperty',
      ] : []),
    ],
    plugins: [
      shim({
        'color-name': 'export default {}'
      }),
      ...(options.resolve ? [resolve()] : []),
      commonjs(),
      babel({ babelHelpers: 'runtime' }),
      glslify({ compress: !!options.minimize }),
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
