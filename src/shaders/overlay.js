import { createProgram, bindAttribute, bindTexture, matrixInverse } from '../webgl-common.js';
import overlayVertexShaderSource from './overlay.vert';
import overlayFragmentShaderSource from './overlay.frag';

/** @typedef {import('../webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('../webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('../webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createOverlayProgram(gl) {
    return createProgram(gl, overlayVertexShaderSource, overlayFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {Record<string, any>} weatherMetadata
 * @param {WebGLTextureWrapper} weatherTexture
 * @param {number} overlayOpacity
 * @param {Float32Array} matrix
 */
export function drawOverlay(gl, program, buffer, weatherMetadata, weatherTexture, overlayOpacity, matrix) {
    const offset = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
    const offsetInverse = matrixInverse(offset);

    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, weatherTexture, program.uniforms['sWeather'], program.uniforms['uWeatherResolution'], 0);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.uniformMatrix4fv(program.uniforms['uOffset'], false, offset);
    gl.uniformMatrix4fv(program.uniforms['uOffsetInverse'], false, offsetInverse);
    gl.uniform1f(program.uniforms['uWeatherMin'], weatherMetadata.min);
    gl.uniform1f(program.uniforms['uWeatherMax'], weatherMetadata.max);
    gl.uniform1f(program.uniforms['uOverlayOpacity'], overlayOpacity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}