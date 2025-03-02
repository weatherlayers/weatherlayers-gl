import pkg from './package.json' assert { type: 'json' };
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import glslMinify from './rollup-plugin-glsl-minify.js';
import worker from 'rollup-plugin-worker-factory';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license';
import { visualizer } from 'rollup-plugin-visualizer';
import tsc from 'typescript';

const CATALOG_URL = process.env.CATALOG_URL ?? 'https://catalog.weatherlayers.com';

function bundle(entrypoint, filename, format, options = {}) {
  if (format === 'cjs') {
    filename = filename.replace('.js', `${options.minimize ? '.min' : ''}.cjs`);
  } else if (format === 'es') {
    filename = filename.replace('.js', `${options.minimize ? '.min' : ''}.js`);
  } else if (format === 'umd') {
    filename = filename.replace('.js', `.umd${options.minimize ? '.min' : ''}.js`);
  }

  const bundleClient = filename.includes('client');
  const bundleGl = filename.includes('deck');
  if (!bundleClient && !bundleGl) {
    throw new Error('Invalid state');
  }
  const banner = [
    `Copyright (c) 2021-${new Date().getFullYear()} WeatherLayers.com`,
    '',
    ...(bundleClient ? [`WeatherLayers Cloud Client ${pkg.version}`] : []),
    ...(bundleGl ? [`WeatherLayers GL ${pkg.version}`] : []),
    '',
    ...(bundleClient ? ['A valid access token is required to use the library. Contact support@weatherlayers.com for details.'] : []),
    '',
    'Homepage - https://weatherlayers.com/',
    'Demo - https://demo.weatherlayers.com/',
    'Docs - https://docs.weatherlayers.com/',
    ...(bundleClient ? ['WeatherLayers Cloud Terms of Use - https://weatherlayers.com/terms-of-use.html'] : []),
    ...(bundleGl ? ['WeatherLayers GL License Terms of Use - https://weatherlayers.com/license-terms-of-use.html'] : []),
  ].join('\n');

  return {
    input: entrypoint,
    output: {
      file: filename,
      format: format,
      name: bundleClient ? 'WeatherLayersClient' : 'WeatherLayers',
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/extensions': 'deck',
        '@deck.gl/layers': 'deck',
        '@luma.gl/core': 'luma',
        '@luma.gl/engine': 'luma',
        'geotiff': 'GeoTIFF',
      },
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
      ...(!options.resolve ? [
        ...Object.keys(pkg.dependencies),
        '@babel/runtime/helpers/defineProperty',
        'rollup-plugin-worker-factory/src/browser.js',
      ] : []),
    ],
    plugins: [
      replace({
        preventAssignment: true,
        __PACKAGE_VERSION__: `"${pkg.version}"`,
        __PACKAGE_DATETIME__: `"${new Date().toISOString()}"`,
        __CATALOG_URL__: `"${CATALOG_URL}"`,
      }),
      json(),
      image(),
      ...(options.resolve ? [resolve()] : []),
      babel({ babelHelpers: 'runtime' }),
      commonjs(),
      typescript({
        typescript: tsc,
        clean: options.stats,
      }),
      glslMinify({ minimize: options.minimize }),
      worker({
        plugins: [
          resolve(),
          commonjs(),
          typescript({
            typescript: tsc,
            clean: options.stats,
            tsconfigOverride: {
              compilerOptions: {
                target: 'es2016', // Fix support for Angular by downgrading to ES2016 target in WebWorkers, see https://github.com/angular/angular-cli/issues/22191
              },
            },
          }),
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
    ['src/client/index.ts', 'dist/weatherlayers-client.js'],
    ['src/deck/index.ts', 'dist/weatherlayers-deck.js'],
  ].map(([entrypoint, filename]) => [
    ...(!commandLineArgs.watch || commandLineArgs.format === 'cjs' ? [
      bundle(entrypoint, filename, 'cjs', { resolve: true }),
      bundle(entrypoint, filename, 'cjs', { resolve: true, minimize: true }),
    ] : []),
    ...(!commandLineArgs.watch || commandLineArgs.format === 'es' ? [
      bundle(entrypoint, filename, 'es', { resolve: true }),
      bundle(entrypoint, filename, 'es', { resolve: true, minimize: true }),
      {
        input: entrypoint,
        output: {
          file: filename.replace('.js', '.d.ts'),
          format: 'es',
        },
        plugins: [
          dts(),
          json(),
          image(),
          postcss({ inject: false }),
        ],
      },
    ] : []),
    ...(!commandLineArgs.watch || !commandLineArgs.format || commandLineArgs.format === 'umd' ? [
      bundle(entrypoint, filename, 'umd', { resolve: true, stats: true }),
      bundle(entrypoint, filename, 'umd', { resolve: true, minimize: true }),
    ] : [])
  ]).flat();
};
