// customized rollup-plugin-glsl
//
// changes:
// - mangleShader - mangle tokens
// - generateCode - export code and tokens
import { createFilter } from 'rollup-pluginutils';
import { GlslMinify } from 'webpack-glsl-minify/build/minify.js';
import { nodeReadFile, nodeDirname } from 'webpack-glsl-minify/build/node.js';

function minifyShader(code, id, minimize) {
  const nomangle = [
    // don't mangle deck.gl names
    'PI', 'EARTH_RADIUS',
    'geometry', 'uv', 'DECKGL_FILTER_COLOR',
    // don't mangle WebGL2 functions
    'texture',
    'floatBitsToUint',
    // don't mangle shader modules
    'layer',
    'opacity',

    'picking',
    'isActive',
    'isAttribute',

    'bitmap',
    'bounds',
    'coordinateConversion',
    'transparentColor',
    '_PI',
    'apply_opacity',
    'getUV',
    'getUVWithCoordinateConversion',

    'raster',
    'imageTexture',
    'imageTexture2',
    'imageResolution',
    'imageSmoothing',
    'imageInterpolation',
    'imageWeight',
    'imageType',
    'imageUnscale',
    'imageMinValue',
    'imageMaxValue',

    'palette',
    'paletteTexture',
    'paletteBounds',
    'paletteColor',
    'getPaletteValue',
    'applyPalette',

    'contour',
    'interval',
    'majorInterval',
    'width',

    'particle',
    'viewportGlobe',
    'viewportGlobeCenter',
    'viewportGlobeRadius',
    'viewportBounds',
    'viewportZoomChangeFactor',
    'numParticles',
    'maxAge',
    'speedFactor',
    'time',
    'seed',
  ];

  // minify
  const glsl = new GlslMinify({
    preserveDefines: true,
    preserveAll: !minimize,
    nomangle: nomangle,
  }, nodeReadFile, nodeDirname);
  return glsl.executeFile({ path: id, contents: code });
}

function generateCode(result) {
  // extract minified uniform tokens
  const tokens = Object.fromEntries(Object.entries(result.uniforms).map(([originalName, {variableName}]) => [originalName, variableName]));

  return `
    // eslint-disable
    export const sourceCode = ${JSON.stringify(result.sourceCode)};
    export const tokens = ${JSON.stringify(tokens)};
  `;
}

export default function glsl(userOptions = {}) {
  const options = Object.assign({
    include: [
      '**/*.vs',
      '**/*.fs',
      '**/*.vert',
      '**/*.frag',
      '**/*.glsl',
    ],
  }, userOptions);

	const filter = createFilter(options.include, options.exclude);

	return {
		name: 'glsl-minify',

		async transform(code, id) {
			if (!filter(id)) return;

      const result = await minifyShader(code, id, options.minimize);

      return {
        code: generateCode(result),
        map: { mappings: '' }
      };
		},
	};
}