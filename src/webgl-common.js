/** @typedef {{ program: WebGLProgram; attributes: Record<string, GLint>; uniforms: Record<string, WebGLUniformLocation>; }} WebGLProgramWrapper */
/** @typedef {{ buffer: WebGLBuffer; x: number; y: number; }} WebGLBufferWrapper */
/** @typedef {{ texture: WebGLTexture; x: number; y: number; }} WebGLTextureWrapper */

/**
 * @param {number} value
 * @return {number}
 */
export function nearestPowerOfTwoSqrt(value) {
    return 2 ** Math.ceil(Math.log2(Math.ceil(Math.sqrt(value))));
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {GLenum} type
 * @param {string} source
 * @return {WebGLShader}
 */
export function createShader(gl, type, source) {
    const shader = /** @type WebGLShader */ (gl.createShader(type));
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(/** @type string */ (gl.getShaderInfoLog(shader)));
    }

    return shader;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} vertexShaderSource
 * @param {string} fragmentShaderSource
 * @return {WebGLProgramWrapper}
 */
export function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const program = /** @type WebGLProgram */ (gl.createProgram());

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(/** @type string */ (gl.getProgramInfoLog(program)));
    }

    const attributes = /** @type WebGLProgramWrapper['attributes'] */ ({});
    const attributesCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributesCount; i++) {
        const attribute = /** @type WebGLActiveInfo */ (gl.getActiveAttrib(program, i));
        attributes[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }

    const uniforms = /** @type WebGLProgramWrapper['uniforms'] */ ({});
    const uniformsCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformsCount; i++) {
        const uniform = /** @type WebGLActiveInfo */ (gl.getActiveUniform(program, i));
        uniforms[uniform.name] = /** @type WebGLUniformLocation */ (gl.getUniformLocation(program, uniform.name));
    }

    const wrapper = /** @type WebGLProgramWrapper */ ({ program, attributes, uniforms });
    return wrapper;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number[] | number[][]} data
 * @returns {WebGLBufferWrapper}
 */
export function createBuffer(gl, data) {
    const buffer = /** @type WebGLBuffer */ (gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.flat()), gl.STATIC_DRAW);

    const x = data.length;
    const y = Array.isArray(data[0]) ? data[0].length : 1;

    const wrapper = /** @type WebGLBufferWrapper */ ({ buffer, x, y });
    return wrapper;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Uint8Array | Float32Array | HTMLImageElement | HTMLCanvasElement} data
 * @param {GLint} filter
 * @param {number} x
 * @param {number} y
 * @return {WebGLTextureWrapper}
 */
export function createTexture(gl, data, filter, x, y) {
    const texture = /** @type WebGLTexture */ (gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    if (data instanceof Uint8Array || data instanceof Uint8ClampedArray || data instanceof Float32Array) {
        const type = data instanceof Float32Array ? gl.FLOAT : gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, type, data);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    const wrapper = /** @type WebGLTextureWrapper */ ({ texture, x, y });
    return wrapper;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLBufferWrapper} buffer
 * @param {GLint} attribute
 */
export function bindAttribute(gl, buffer, attribute) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, buffer.y, gl.FLOAT, false, 0, 0);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLTextureWrapper} texture
 * @param {WebGLUniformLocation} textureUniform
 * @param {WebGLUniformLocation | null} resolutionUniform
 * @param {number} unit
 */
export function bindTexture(gl, texture, textureUniform, resolutionUniform, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
    gl.uniform1i(textureUniform, unit);
    if (resolutionUniform) {
        gl.uniform2f(resolutionUniform, texture.x, texture.y);
    }
}

/**
 * @param {Float32Array} matrix
 * @return {Float32Array}
 */
export function inverseMatrix(matrix) {
    return new window.DOMMatrixReadOnly(Array.from(matrix)).inverse().toFloat32Array();
}