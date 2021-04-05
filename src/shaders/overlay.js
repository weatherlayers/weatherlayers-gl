import { createProgram, bindAttribute, bindTexture } from '../webgl-common.js';
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
 * @param {WebGLTextureWrapper} sourceTexture
 * @param {[number, number]} sourceBounds
 * @param {WebGLTextureWrapper} colorRampTexture
 * @param {number} opacity
 * @param {number[]} matrix
 */
export function drawOverlay(gl, program, buffer, sourceTexture, sourceBounds, colorRampTexture, opacity, matrix) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, sourceTexture, program.uniforms['sSource'], program.uniforms['uSourceResolution'], 0);
    gl.uniform1f(program.uniforms['uSourceBoundsMin'], sourceBounds[0]);
    gl.uniform1f(program.uniforms['uSourceBoundsMax'], sourceBounds[1]);
    bindTexture(gl, colorRampTexture, program.uniforms['sColorRamp'], null, 1);
    gl.uniform1f(program.uniforms['uOpacity'], opacity);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}