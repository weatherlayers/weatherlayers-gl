
import { createProgram, bindAttribute, bindTexture } from '../webgl-common.js';
import quadVertexShaderSource from './quad.vert';
import stepFragmentShaderSource from './step.frag';

/** @typedef {import('../webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('../webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('../webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */

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
 * @param {WebGLTextureWrapper} weatherTexture
 * @param {number} weatherMin
 * @param {number} weatherMax
 * @param {number} speedFactor
 * @param {number} dropRate
 * @param {number} dropRateBump
 * @param {Float32Array} matrix
 * @param {Float32Array} matrixInverse
 */
export function computeStep(gl, program, buffer, particlesStateTexture, weatherTexture, weatherMin, weatherMax, speedFactor, dropRate, dropRateBump, matrix, matrixInverse) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, particlesStateTexture, program.uniforms['sState'], null, 0);
    bindTexture(gl, weatherTexture, program.uniforms['sWeather'], program.uniforms['uWeatherResolution'], 1);
    gl.uniform1f(program.uniforms['uWeatherMin'], weatherMin);
    gl.uniform1f(program.uniforms['uWeatherMax'], weatherMax);
    gl.uniform1f(program.uniforms['uSpeedFactor'], speedFactor);
    gl.uniform1f(program.uniforms['uDropRate'], dropRate);
    gl.uniform1f(program.uniforms['uDropRateBump'], dropRateBump);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.uniformMatrix4fv(program.uniforms['uMatrixInverse'], false, matrixInverse);
    gl.uniform1f(program.uniforms['uRandomSeed'], Math.random());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}