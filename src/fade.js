import { createProgram, createBuffer, bindFramebuffer, bindAttribute, bindTexture } from './webgl-common.js';
import fadeVertexShaderSource from './shaders/fade.vert';
import fadeFragmentShaderSource from './shaders/fade.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createFadeProgram(gl) {
    return createProgram(gl, fadeVertexShaderSource, fadeFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLBufferWrapper}
 */
export function createFadeIndexBuffer(gl) {
    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const fadePosition = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const fadePositionBuffer = createBuffer(gl, fadePosition);
    return fadePositionBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} fadeProgram
 * @param {WebGLFramebuffer} particlesFramebuffer
 * @param {WebGLBufferWrapper} fadePositionBuffer
 * @param {WebGLTextureWrapper} particlesScreenTexture0
 * @param {WebGLTextureWrapper} particlesScreenTexture1
 * @param {number} fadeOpacity
 */
export function drawFade(gl, fadeProgram, particlesFramebuffer, fadePositionBuffer, particlesScreenTexture0, particlesScreenTexture1, fadeOpacity) {
    bindFramebuffer(gl, particlesFramebuffer, particlesScreenTexture1.texture);

    gl.useProgram(fadeProgram.program);
    bindAttribute(gl, fadePositionBuffer, fadeProgram.attributes['aPosition']);
    bindTexture(gl, particlesScreenTexture0, fadeProgram.uniforms['sScreen'], null, 0);
    gl.uniform1f(fadeProgram.uniforms['uFadeOpacity'], fadeOpacity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, fadePositionBuffer.x);

    bindFramebuffer(gl, null);
}