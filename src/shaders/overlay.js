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
 * @param {WebGLTextureWrapper} overlayColorRampTexture
 * @param {number} overlayOpacity
 * @param {number[]} matrix
 */
export function drawOverlay(gl, program, buffer, sourceTexture, overlayColorRampTexture, overlayOpacity, matrix) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, sourceTexture, program.uniforms['sSource'], program.uniforms['uSourceResolution'], 0);
    bindTexture(gl, overlayColorRampTexture, program.uniforms['sOverlayColorRamp'], null, 1);
    gl.uniform1f(program.uniforms['uOverlayOpacity'], overlayOpacity);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}