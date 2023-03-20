import pkg from './package.json';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import glslMinify from './rollup-plugin-glsl-minify';
import worker from 'rollup-plugin-worker-factory';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import { terser } from 'rollup-plugin-terser';
import license from 'rollup-plugin-license';
import visualizer from 'rollup-plugin-visualizer';
import gnirts from 'gnirts';

const LICENSE_DATE = process.env.LICENSE_DAYS ? new Date(new Date().valueOf() + parseInt(process.env.LICENSE_DAYS, 10) * 24 * 60 * 60 * 1000) : undefined;
const LICENSE_DOMAIN = process.env.LICENSE_DOMAIN;
const CATALOG_URL = process.env.CATALOG_URL ?? 'https://catalog.weatherlayers.com';

function bundle(entrypoint, filename, format, options = {}) {
  filename = filename.replace('.js', `.${format}${options.minimize ? '.min' : ''}.js`);

  const bundleGl = filename.includes('deck') || filename.includes('standalone');
  const bundleClient = filename.includes('client');
  const banner = [
    'Copyright (c) 2021-2023 WeatherLayers.com',
    '',
    ...(bundleGl && !LICENSE_DATE && !LICENSE_DOMAIN ? [`WeatherLayers GL ${pkg.version}`] : []),
    ...(bundleGl && LICENSE_DATE && !LICENSE_DOMAIN ? [`WeatherLayers GL ${pkg.version}, Trial License, valid until ${LICENSE_DATE.toISOString().replace('T', ' ').replace(/\.[\d]+Z$/, '')}`] : []),
    ...(bundleGl && !LICENSE_DATE && LICENSE_DOMAIN ? [`WeatherLayers GL ${pkg.version}, Project License, valid for ${LICENSE_DOMAIN}`] : []),
    ...(bundleClient ? ['WeatherLayers Client'] : []),
    '',
    'Demo - https://demo.weatherlayers.com/',
    'Docs - https://docs.weatherlayers.com/',
    ...(bundleGl ? ['License Terms of Use - https://weatherlayers.com/license-terms-of-use.html'] : []),
  ].join('\n');

  return {
    input: entrypoint,
    output: {
      file: filename,
      format: format,
      name: bundleClient ? 'WeatherLayersClient' : 'WeatherLayers',
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
        'geodesy-fn/src/spherical',
        'leaflet-polylinedecorator/src/patternUtils',
      ] : []),
    ],
    plugins: [
      replace({
        preventAssignment: true,
        __VERSION__: `"${pkg.version}"`,
        __LICENSE_DATE__: LICENSE_DATE ? gnirts.getCode(LICENSE_DATE.valueOf().toString(36)) : '""',
        __LICENSE_DOMAIN__: LICENSE_DOMAIN ? gnirts.getCode(LICENSE_DOMAIN) : '""',
        __CATALOG_URL__: `"${CATALOG_URL}"`,
      }),
      alias({
        entries: [
          { find: '@luma.gl/constants', replacement: __dirname + '/src/_utils/gl.js' },
        ],
      }),
      json(),
      image(),
      ...(options.resolve ? [resolve()] : []),
      babel({ babelHelpers: 'runtime' }),
      commonjs(),
      glslMinify({ minimize: options.minimize }),
      worker({
        plugins: [
          resolve(),
          commonjs(),
        ],
        type: 'browser',
      }),
      postcss({ plugins: [autoprefixer(), assets()], minimize: options.minimize }),
      ...(options.minimize ? [terser({ output: { comments: false } })] : []),
      license({
        banner: {
          content: banner,
          commentStyle: 'ignored',
        },
      }),
      ...(options.stats ? [visualizer({
        filename: filename + '.stats.html',
      })] : []),
    ],
  };
}

export default commandLineArgs => {
  return [
    ['src/deck/index.js', 'dist/weatherlayers-deck.js'],
    ['src/client/index.js', 'dist/weatherlayers-client.js'],
    ['src/standalone/index.js', 'dist/weatherlayers-standalone.js'],
  ].map(([entrypoint, filename]) => [
    ...(!commandLineArgs.watch ? [
      bundle(entrypoint, filename, 'cjs', { resolve: true }),
      bundle(entrypoint, filename, 'cjs', { resolve: true, minimize: true }),
      bundle(entrypoint, filename, 'es', { resolve: true }),
      bundle(entrypoint, filename, 'es', { resolve: true, minimize: true }),
    ] : []),
    bundle(entrypoint, filename, 'umd', { resolve: true, stats: true }),
    bundle(entrypoint, filename, 'umd', { resolve: true, minimize: true }),
  ]).flat();
};
