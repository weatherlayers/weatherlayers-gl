
import { createProgram, bindAttribute, bindTexture } from './webgl-common.js';
import quadVertexShaderSource from './shaders/quad.vert';
import stepFragmentShaderSource from './shaders/step.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createStepProgram(gl) {
    return createProgram(gl, quadVertexShaderSource, stepFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {WebGLTextureWrapper} particlesStateTexture
 * @param {Record<string, any>} weatherMetadata
 * @param {WebGLTextureWrapper} weatherTexture
 * @param {number} speedFactor
 * @param {number} dropRate
 * @param {number} dropRateBump
 */
export function computeStep(gl, program, buffer, particlesStateTexture, weatherMetadata, weatherTexture, speedFactor, dropRate, dropRateBump) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, particlesStateTexture, program.uniforms['sState'], null, 0);
    bindTexture(gl, weatherTexture, program.uniforms['sWeather'], program.uniforms['uWeatherResolution'], 1);
    gl.uniform1f(program.uniforms['uWeatherMin'], weatherMetadata.min);
    gl.uniform1f(program.uniforms['uWeatherMax'], weatherMetadata.max);
    gl.uniform1f(program.uniforms['uSpeedFactor'], speedFactor);
    gl.uniform1f(program.uniforms['uDropRate'], dropRate);
    gl.uniform1f(program.uniforms['uDropRateBump'], dropRateBump);
    gl.uniform1f(program.uniforms['uRandomSeed'], Math.random());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}