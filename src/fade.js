import { createProgram, bindAttribute, bindTexture } from './webgl-common.js';
import quadVertexShaderSource from './shaders/quad.vert';
import fadeFragmentShaderSource from './shaders/fade.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createFadeProgram(gl) {
    return createProgram(gl, quadVertexShaderSource, fadeFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {WebGLTextureWrapper} particlesScreenTexture
 * @param {number} fadeOpacity
 */
export function drawFade(gl, program, buffer, particlesScreenTexture, fadeOpacity) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, particlesScreenTexture, program.uniforms['sScreen'], null, 0);
    gl.uniform1f(program.uniforms['uFadeOpacity'], fadeOpacity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}