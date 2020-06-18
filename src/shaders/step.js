
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
 * @param {WebGLTextureWrapper} sourceTexture
 * @param {[number, number]} sourceBounds
 * @param {number} speedFactor
 * @param {number} dropRate
 * @param {number} dropRateBump
 * @param {[[number, number], [number, number]]} worldBounds
 */
export function computeStep(gl, program, buffer, particlesStateTexture, sourceTexture, sourceBounds, speedFactor, dropRate, dropRateBump, worldBounds) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, particlesStateTexture, program.uniforms['sState'], null, 0);
    bindTexture(gl, sourceTexture, program.uniforms['sSource'], program.uniforms['uSourceResolution'], 1);
    gl.uniform1f(program.uniforms['uSourceBoundsMin'], sourceBounds[0]);
    gl.uniform1f(program.uniforms['uSourceBoundsMax'], sourceBounds[1]);
    gl.uniform1f(program.uniforms['uSpeedFactor'], speedFactor);
    gl.uniform1f(program.uniforms['uDropRate'], dropRate);
    gl.uniform1f(program.uniforms['uDropRateBump'], dropRateBump);
    gl.uniform2fv(program.uniforms['uWorldBoundsMin'], worldBounds[0]);
    gl.uniform2fv(program.uniforms['uWorldBoundsMax'], worldBounds[1]);
    gl.uniform1f(program.uniforms['uRandomSeed'], Math.random());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}