/** @typedef {{ program: WebGLProgram; attributes: Record<string, GLint>; uniforms: Record<string, WebGLUniformLocation>; }} WebGLProgramWrapper */

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

    const attributes = /** @type WebGLProgramWrapper["attributes"] */ ({});
    const attributesCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributesCount; i++) {
        const attribute = /** @type WebGLActiveInfo */ (gl.getActiveAttrib(program, i));
        attributes[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }

    const uniforms = /** @type WebGLProgramWrapper["uniforms"] */ ({});
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
 * @param {HTMLImageElement} image
 * @return {WebGLTexture}
 */
export function createTexture(gl, image) {
    const texture = /** @type WebGLTexture */ (gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Float32Array} data
 * @returns {WebGLBuffer}
 */
export function createBuffer(gl, data) {
    const buffer = /** @type WebGLBuffer */ (gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLBuffer} buffer
 * @param {GLint} attribute
 * @param {number} componentsCount
 */
export function bindAttribute(gl, buffer, attribute, componentsCount) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, componentsCount, gl.FLOAT, false, 0, 0);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLTexture} texture
 * @param {number} unit
 */
export function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}
