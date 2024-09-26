// customized rollup-plugin-glsl
//
// changes:
// - mangleShader - mangle tokens
// - generateCode - export code and tokens
import { createFilter } from 'rollup-pluginutils';
import { GlslMinify } from 'webpack-glsl-minify/build/minify.js';
import { nodeReadFile, nodeDirname } from 'webpack-glsl-minify/build/node.js';
import { fileURLToPath } from 'node:url';

const modules = [
  {
    structName: 'bitmapUniforms',
    uniformBufferName: 'bitmap',
    path: './src/deck/shaderlib/bitmap-module/bitmap-module.glsl',
  },
  {
    structName: 'rasterUniforms',
    uniformBufferName: 'raster',
    path: './src/deck/shaderlib/raster-module/raster-module.glsl',
  },
  {
    structName: 'paletteUniforms',
    uniformBufferName: 'palette',
    path: './src/deck/shaderlib/palette-module/palette-module.glsl',
  },
  {
    structName: 'contourUniforms',
    uniformBufferName: 'contour',
    path: './src/deck/layers/contour-layer/contour-module.glsl',
  },
  {
    structName: 'particleUniforms',
    uniformBufferName: 'particle',
    path: './src/deck/layers/particle-layer/particle-module.glsl',
  },
];

const modulesGlsl = modules.map(module => `@include "${module.path}"`).join('\n');

async function minifyShader(code, id, minimize) {
  const nomangle = [
    // don't mangle WebGL2 functions
    'texture',
    'floatBitsToUint',

    // don't mangle deck.gl names
    'PI',
    'EARTH_RADIUS',
    'geometry',
    'uv',
    'DECKGL_FILTER_COLOR',

    // don't mangle deck.gl shader modules
    'layer', // upcoming in deck.gl 9.1
    'opacity',

    'picking',
    'isActive',
    'isAttribute',

    // don't mangle shader modules
    ...modules.map(module => [module.structName, module.uniformBufferName]).flat(),
  ];

  const glsl = new GlslMinify({
    preserveDefines: true,
    preserveAll: !minimize,
    nomangle: nomangle,
  }, nodeReadFile, nodeDirname);

  // minify shader modules in the same GlslMinify instance to get their tokens
  await glsl.executeFile({ path: fileURLToPath(import.meta.url), contents: modulesGlsl });

  // minify shader
  const result = await glsl.executeFile({ path: id, contents: code });
  const tokens = getTokens(glsl.tokens);

  return { sourceCode: result.sourceCode, tokens };
}

// use instead of tokenMap.getUniforms, because it doesn't support uniforms in UBOs (missing variableType) and nomangle in UBOs (not renamed)
function getTokens(tokenMap) {
  // filter only the tokens that have the type field set, or that have been renamed
  const tokens = {};
  for (const original in tokenMap.tokens) {
    const token = tokenMap.tokens[original];
    if (token.variableType || original !== token.variableName || tokenMap.options.nomangle.includes(original)) {
      tokens[original] = token.variableName;
    }
  }
  return tokens;
}

function generateCode(result) {
  return `
    // eslint-disable
    export const sourceCode = ${JSON.stringify(result.sourceCode)};
    export const tokens = ${JSON.stringify(result.tokens)};
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