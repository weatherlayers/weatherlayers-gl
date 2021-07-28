import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import shim from 'rollup-plugin-shim';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

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
        '@luma.gl/constants': 'luma.GL',
        '@luma.gl/core': 'luma',
        'geotiff': 'GeoTIFF',
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
