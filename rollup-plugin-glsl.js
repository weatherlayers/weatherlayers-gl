// customized rollup-plugin-glsl
//
// changes:
// - compressShader - single-line mode to compress multi-line comments, trim
// - mangleShader - mangle tokens
// - generateCode - export code and tokens

import { createFilter } from 'rollup-pluginutils';

function compressShader(code) {
  let needNewline = false;
  return code.replace(/\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/gs, "").split(/\n+/).reduce((result, line) => {
    line = line.trim().replace(/\s{2,}|\t/, " ");
    if (line[0] === '#') {
      if (needNewline) {
        result.push("\n");
      }

      result.push(line, "\n");
      needNewline = false
    } else {
      result.push(line
        .replace(/\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|\-|!|;)\s*/g, "$1"))
      needNewline = true;
    }
    return result;
  }, []).join('').replace(/\n+/g, "\n").trim();
}

// from https://github.com/leosingleton/webpack-glsl-minify/blob/master/src/minify.ts
const glslTypes = [
  // Basic types
  'bool', 'double', 'float', 'int', 'uint',

  // Vector types
  'vec2', 'vec3', 'vec4',
  'bvec2', 'bvec3', 'bvec4',
  'dvec2', 'dvec3', 'dvec4',
  'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4',

  // Matrix types
  'mat2', 'mat2x2', 'mat2x3', 'mat2x4',
  'mat3', 'mat3x2', 'mat3x3', 'mat3x4',
  'mat4', 'mat4x2', 'mat4x3', 'mat4x4',

  // Sampler types
  'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube', 'sampler2DRect',
  'isampler1D', 'isampler2D', 'isampler3D', 'isamplerCube', 'isampler2DRect',
  'usampler1D', 'usampler2D', 'usampler3D', 'usamplerCube', 'usampler2DRect',

  'sampler1DArray', 'sampler2DArray', 'samplerCubeArray',
  'isampler1DArray', 'isampler2DArray', 'isamplerCubeArray',
  'usampler1DArray', 'usampler2DArray', 'usamplerCubeArray',

  'samplerBuffer', 'sampler2DMS', 'sampler2DMSArray',
  'isamplerBuffer', 'isampler2DMS', 'isampler2DMSArray',
  'usamplerBuffer', 'usampler2DMS', 'usampler2DMSArray',

  'sampler1DShadow', 'sampler2DShadow', 'samplerCubeShadow', 'sampler2DRectShadow', 'sampler1DArrayShadow',
  'sampler2DArrayShadow', 'samplerCubeArrayShadow',

  'void'
];

const glslTypeQualifiers = [
  // Other type-related keywords
  'attribute', 'const', 'invariant', 'struct', 'uniform', 'varying',

  // Precision keywords
  'highp', 'lowp', 'mediump', 'precision',

  // Input/output keywords
  'in', 'inout', 'out',

  // Interpolation qualifiers
  'flat', 'noperspective', 'smooth', 'centroid', 'sample',

  // Memory qualifiers
  'coherent', 'volatile', 'restrict', 'readonly', 'writeonly'
];

function getMinifiedName(tokenCount) {
  const num = tokenCount % 52;
  const offset = (num < 26) ? (num + 65) : (num + 71); // 65 = 'A'; 71 = ('a' - 26)
  const c = String.fromCharCode(offset);

  // For tokens over 52, recursively add characters
  const recurse = Math.floor(tokenCount / 52);
  return (recurse === 0) ? c : (getMinifiedName(recurse - 1) + c);
}

const tokenMap = new Map();

function mangleShader(code, compress) {
  const tokens = {};

  const matches = Array.from(code.matchAll(new RegExp(`\\b(?:(${glslTypeQualifiers.join('|')})[ \\t]+)?(${glslTypes.join('|')})[ \\t]+(\\w+)`, 'g')));
  // console.log(matches.map(x => x.slice(1)));
  matches.forEach(match => {
    const tokenTypeQualifier = match[1];
    const token = match[3];

    if (token === 'main') {
      return;
    }

    let compressedToken;
    if (compress) {
      // cache compressed tokens to reuse across multiple files
      if (!tokenMap.has(token)) {
        compressedToken = getMinifiedName(tokenMap.size);
        tokenMap.set(token, compressedToken);
      } else {
        compressedToken = tokenMap.get(token);
      }

      // replace with a prefix to prevent overwriting other tokens or swizzles
      code = code.replace(new RegExp(`\\b(?<![$\.])${token}\\b`, 'g'), '$' + compressedToken);
    }
    
    // export external tokens
    if (['attribute', 'uniform', 'in', 'inout', 'out'].includes(tokenTypeQualifier)) {
      tokens[token] = compressedToken || token;
    }
  });

  if (compress) {
    // remove the prefix
    code = code.replaceAll('$', '');
  }

	return { code, tokens };
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
		name: 'glsl',

		transform(code, id) {
			if (!filter(id)) return;

      const result = mangleShader(code, options.compress);

      if (options.compress !== false) {
        result.code = compressShader(result.code);
      }

      return {
        code: generateCode(result),
        map: { mappings: '' }
      };
		}
	};
}