
import { createProgram, bindAttribute, bindTexture } from '../webgl-common.js';
import quadVertexShaderSource from './quad.vert';
import updateFragmentShaderSource from './update.frag';

/** @typedef {import('../webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('../webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('../webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createUpdateProgram(gl) {
    return createProgram(gl, quadVertexShaderSource, updateFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {WebGLTextureWrapper} particlesStateTexture
 * @param {WebGLTextureWrapper} sourceTexture
 * @param {[[number, number], [number, number]]} worldBounds
 * @param {number} speedFactor
 * @param {number} maxAge
 * @param {number} frameNumber
 */
export function runUpdate(gl, program, buffer, particlesStateTexture, sourceTexture, worldBounds, speedFactor, maxAge, frameNumber) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, particlesStateTexture, program.uniforms['sState'], program.uniforms['uStateResolution'], 0);
    bindTexture(gl, sourceTexture, program.uniforms['sSource'], program.uniforms['uSourceResolution'], 1);
    gl.uniform2fv(program.uniforms['uWorldBoundsMin'], worldBounds[0]);
    gl.uniform2fv(program.uniforms['uWorldBoundsMax'], worldBounds[1]);
    gl.uniform1f(program.uniforms['uSpeedFactor'], speedFactor);
    gl.uniform1f(program.uniforms['uMaxAge'], maxAge);
    gl.uniform1f(program.uniforms['uFrameNumber'], frameNumber);
    gl.uniform1f(program.uniforms['uRandomSeed'], Math.random());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}