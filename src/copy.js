import { createProgram, bindAttribute, bindTexture } from './webgl-common.js';
import quadVertexShaderSource from './shaders/quad.vert';
import copyFragmentShaderSource from './shaders/copy.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createCopyProgram(gl) {
    return createProgram(gl, quadVertexShaderSource, copyFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {WebGLTextureWrapper} screenTexture
 */
export function drawCopy(gl, program, buffer, screenTexture) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, screenTexture, program.uniforms['sScreen'], null, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}