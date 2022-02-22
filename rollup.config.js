import pkg from './package.json';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import shim from 'rollup-plugin-shim';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import glslMinify from './rollup-plugin-glsl-minify';
import worker from 'rollup-plugin-worker-factory';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import gnirts from 'gnirts';

function bundle(entrypoint, filename, format, options = {}) {
  filename = filename.replace('.js', `.${format}${options.minimize ? '.min' : ''}.js`);

  return {
    input: entrypoint,
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
      banner: `/*!
* Copyright (c) 2021 WeatherLayers.com${process.env.TRIAL_UNTIL ? `\n* Trial until ${process.env.TRIAL_UNTIL}` : ''}
*/`,
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
      ...(!options.resolve ? [
        ...Object.keys(pkg.dependencies),
        '@babel/runtime/helpers/defineProperty',
        'rollup-plugin-worker-factory/src/universal.js',
        'geodesy-fn/src/spherical',
        'leaflet-polylinedecorator/src/patternUtils',
      ] : []),
    ],
    plugins: [
      replace({
        preventAssignment: true,
        __version__: pkg.version,
        __trialUntil__: gnirts.getCode((process.env.TRIAL_UNTIL ? new Date(process.env.TRIAL_UNTIL).valueOf() : Number.MAX_SAFE_INTEGER).toString(36)),
      }),
      alias({
        entries: [
          { find: '@luma.gl/constants', replacement: __dirname + '/src/_utils/gl.js' },
        ],
      }),
      shim({
        'color-name': 'export default {}',
      }),
      ...(options.resolve ? [resolve()] : []),
      babel({ babelHelpers: 'runtime' }),
      commonjs(),
      glslMinify({ minimize: options.minimize }),
      worker({ plugins: [resolve(), commonjs()] }),
      postcss({ plugins: [autoprefixer(), assets()], minimize: options.minimize }),
      ...(options.minimize ? [terser()] : []),
      ...(options.stats ? [visualizer({
        filename: filename + '.stats.html',
      })] : []),
    ],
  };
}

export default [
  ['src/cloud-client/index.js', 'dist/weatherlayers-cloud-client.js'],
  ['src/cloud-deck/index.js', 'dist/weatherlayers-cloud-deck.js'],
  ['src/cloud-arcgis/index.js', 'dist/weatherlayers-cloud-arcgis.js'],
  ['src/deck/index.js', 'dist/weatherlayers-deck.js'],
  ['src/arcgis/index.js', 'dist/weatherlayers-arcgis.js'],
].map(([entrypoint, filename]) => [
  bundle(entrypoint, filename, 'cjs'),
  bundle(entrypoint, filename, 'cjs', { minimize: true }),
  bundle(entrypoint, filename, 'es'),
  bundle(entrypoint, filename, 'es', { minimize: true }),
  bundle(entrypoint, filename, 'umd', { resolve: true, stats: true }),
  bundle(entrypoint, filename, 'umd', { resolve: true, minimize: true }),
]).flat();
