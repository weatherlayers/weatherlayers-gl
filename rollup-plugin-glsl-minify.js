// customized rollup-plugin-glsl
//
// changes:
// - mangleShader - mangle tokens
// - generateCode - export code and tokens
import * as fs from 'fs';

import { createFilter } from 'rollup-pluginutils';
import { GlslMinify } from 'webpack-glsl-minify/build/minify';

async function minifyShader(code, id, minimize) {
  // injected deck.gl names
  const injectedNames = ['PI', 'EARTH_RADIUS', 'uv', 'picking_uActive', 'bitmapColor', 'instanceSourcePositions', 'instanceTargetPositions', 'sourcePosition', 'targetPosition', 'drop'];

  // injected deck.gl declaration fragment
  const injectDecl = id.match(/(main-start|main-end)/);
  if (injectDecl) {
    const declId = id.replace(/(main-start|main-end)/, 'decl');
    if (fs.existsSync(declId)) {
      const declCode = fs.readFileSync(declId).toString();

      // minify deck.gl declaration fragment
      // TODO: reuse?
      const glslMinify = new GlslMinify({
        preserveAll: !minimize,
        nomangle: injectedNames,
      });
      await glslMinify.execute(declCode);

      // use minified names from deck.gl declaration fragment in current code
      Object.entries(glslMinify.tokens.tokens)
        .filter(([originalName, {variableName}]) => originalName !== variableName)
        .forEach(([originalName, {variableName}]) => {
          code = code.replace(new RegExp(`\\b(?<!\\.)${originalName}\\b`, 'g'), variableName);
          injectedNames.push(variableName);
        });
      }
  }

  // minify current code
  const glslMinify = new GlslMinify({
    preserveAll: !minimize,
    nomangle: injectedNames,
  });
  const glslMinifyResult = await glslMinify.execute(code);
  code = glslMinifyResult.sourceCode;

  // extract current tokens
  const tokens = Object.fromEntries(
    Object.entries(glslMinify.tokens.tokens)
      .filter(([originalName, {variableName, variableType}]) => variableType || originalName !== variableName || ['sourcePosition', 'targetPosition'].includes(originalName))
      .map(([originalName, {variableName}]) => [originalName, variableName])
  );

  const result = { code, tokens };
  return result;
}

function generateCode(result) {
  return `
    // eslint-disable
    export const code = ${JSON.stringify(result.code)};
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