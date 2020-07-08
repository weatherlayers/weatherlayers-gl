import { createProgram, createBuffer, bindAttribute, bindTexture } from '../webgl-common.js';
import particlesVertexShaderSource from './particles.vert';
import particlesFragmentShaderSource from './particles.frag';

/** @typedef {import('../webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('../webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('../webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} particlesCount
 * @return {WebGLBufferWrapper}
 */
export function createParticlesBuffer(gl, particlesCount) {
    // a quad for each particle
    const particles = new Array(particlesCount).fill(undefined).map((_, i) => [4*i, 4*i+1, 4*i+2, 4*i+1, 4*i+2, 4*i+3]).flat();
    const particlesBuffer = createBuffer(gl, particles);
    return particlesBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createParticlesProgram(gl) {
    return createProgram(gl, particlesVertexShaderSource, particlesFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {WebGLTextureWrapper} particlesStateTexture0
 * @param {WebGLTextureWrapper} particlesStateTexture1
 * @param {number} particleSize
 * @param {[number, number, number, number]} particleColor
 * @param {boolean} particleWaves
 * @param {number[]} matrix
 * @param {[[number, number], [number, number]]} worldBounds
 */
export function drawParticles(gl, program, buffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor, particleWaves, matrix, worldBounds) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aIndex']);
    bindTexture(gl, particlesStateTexture0, program.uniforms['sState0'], program.uniforms['uStateResolution'], 0);
    bindTexture(gl, particlesStateTexture1, program.uniforms['sState1'], null, 1);
    gl.uniform1f(program.uniforms['uParticleSize'], particleSize);
    gl.uniform4fv(program.uniforms['uParticleColor'], particleColor);
    gl.uniform1f(program.uniforms['uParticleWaves'], particleWaves ? 1 : 0);
    gl.uniformMatrix4fv(program.uniforms['uMatrix'], false, matrix);
    gl.uniform2fv(program.uniforms['uWorldBoundsMin'], worldBounds[0]);
    gl.uniform2fv(program.uniforms['uWorldBoundsMax'], worldBounds[1]);
    gl.uniform2f(program.uniforms['uPixelSize'], 1 / gl.canvas.width, 1 / gl.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, buffer.x);
}