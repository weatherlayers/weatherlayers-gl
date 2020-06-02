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
 * @param {WebGLTextureWrapper} weatherTexture
 * @param {number} weatherMin
 * @param {number} weatherMax
 * @param {number} overlayOpacity
 * @param {Float32Array} matrix
 */
export function drawOverlay(gl, program, buffer, weatherTexture, weatherMin, weatherMax, overlayOpacity, matrix) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, weatherTexture, program.uniforms['sWeather'], program.uniforms['uWeatherResolution'], 0);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.uniform1f(program.uniforms['uWeatherMin'], weatherMin);
    gl.uniform1f(program.uniforms['uWeatherMax'], weatherMax);
    gl.uniform1f(program.uniforms['uOverlayOpacity'], overlayOpacity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}