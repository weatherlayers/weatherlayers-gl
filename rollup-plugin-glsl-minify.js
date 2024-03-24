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
    // don't mangle injected deck.gl names
    'PI', 'EARTH_RADIUS',
    'transparentColor', 'opacity', 'coordinateConversion', 'bounds',
    'geometry', 'uv', 'DECKGL_FILTER_COLOR',
    'picking_uActive',
    // don't mangle WebGL2 functions
    'floatBitsToUint',
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