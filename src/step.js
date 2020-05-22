
import { createProgram, createBuffer, bindAttribute, bindTexture } from './webgl-common.js';
import stepVertexShaderSource from './shaders/step.vert';
import stepFragmentShaderSource from './shaders/step.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createStepProgram(gl) {
    return createProgram(gl, stepVertexShaderSource, stepFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLBufferWrapper}
 */
export function createStepPositionBuffer(gl) {
    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const stepPosition = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const stepPositionBuffer = createBuffer(gl, stepPosition);
    return stepPositionBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} stepProgram
 * @param {WebGLBufferWrapper} stepPositionBuffer
 * @param {WebGLTextureWrapper} particlesStateTexture
 * @param {Record<string, any>} weatherMetadata
 * @param {WebGLTextureWrapper} weatherTexture
 * @param {number} speedFactor
 * @param {number} dropRate
 * @param {number} dropRateBump
 */
export function computeStep(gl, stepProgram, stepPositionBuffer, particlesStateTexture, weatherMetadata, weatherTexture, speedFactor, dropRate, dropRateBump) {
    gl.useProgram(stepProgram.program);
    bindAttribute(gl, stepPositionBuffer, stepProgram.attributes['aPosition']);
    bindTexture(gl, particlesStateTexture, stepProgram.uniforms['sState'], null, 0);
    bindTexture(gl, weatherTexture, stepProgram.uniforms['sWeather'], stepProgram.uniforms['uWeatherResolution'], 1);
    gl.uniform1f(stepProgram.uniforms['uWeatherMin'], weatherMetadata.min);
    gl.uniform1f(stepProgram.uniforms['uWeatherMax'], weatherMetadata.max);
    gl.uniform1f(stepProgram.uniforms['uSpeedFactor'], speedFactor);
    gl.uniform1f(stepProgram.uniforms['uDropRate'], dropRate);
    gl.uniform1f(stepProgram.uniforms['uDropRateBump'], dropRateBump);
    gl.uniform1f(stepProgram.uniforms['uRandomSeed'], Math.random());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, stepPositionBuffer.x);
}