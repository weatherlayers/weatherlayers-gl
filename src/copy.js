import { createProgram, createBuffer, bindFramebuffer, bindAttribute, bindTexture } from './webgl-common.js';
import copyVertexShaderSource from './shaders/copy.vert';
import copyFragmentShaderSource from './shaders/copy.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createCopyProgram(gl) {
    return createProgram(gl, copyVertexShaderSource, copyFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLBufferWrapper}
 */
export function createCopyIndexBuffer(gl) {
    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const copyPosition = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const copyPositionBuffer = createBuffer(gl, copyPosition);
    return copyPositionBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} copyProgram
 * @param {WebGLBufferWrapper} copyPositionBuffer
 * @param {WebGLTextureWrapper} screenTexture
 */
export function drawCopy(gl, copyProgram, copyPositionBuffer, screenTexture) {
    gl.useProgram(copyProgram.program);
    bindAttribute(gl, copyPositionBuffer, copyProgram.attributes['aPosition']);
    bindTexture(gl, screenTexture, copyProgram.uniforms['sScreen'], null, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, copyPositionBuffer.x);
}