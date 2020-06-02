import { createProgram, createBuffer, createElementBuffer, bindAttribute, bindTexture } from '../webgl-common.js';
import particlesVertexShaderSource from './particles.vert';
import particlesFragmentShaderSource from './particles.frag';

/** @typedef {import('../webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('../webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('../webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */

/**
 * @param {number} particlesCount
 * @return {Uint8Array}
 */
export function initParticlesState(particlesCount) {
    // each pixel holds a particle position encoded as x = RG, y = BA
    const particleState = new Uint8Array(particlesCount * 4);
    for (let i = 0; i < particleState.length; i++) {
        particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
    }
    return particleState;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} particlesCount
 * @return {WebGLBufferWrapper}
 */
export function createParticlesBuffer(gl, particlesCount) {
    // indexes in particles state texture
    const particles = new Array(particlesCount * 4).fill(undefined).map((_, i) => i);
    const particlesBuffer = createBuffer(gl, particles);
    return particlesBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} particlesCount
 * @return {WebGLBufferWrapper}
 */
export function createParticlesIndexBuffer(gl, particlesCount) {
    // indexes in indexes in particles state texture
    const particles = new Array(particlesCount).fill(undefined).map((_, i) => [4*i, 4*i+1, 4*i+2, 4*i+1, 4*i+2, 4*i+3]).flat();
    const particlesIndexBuffer = createElementBuffer(gl, particles);
    return particlesIndexBuffer;
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
 * @param {WebGLBufferWrapper} indexBuffer
 * @param {WebGLTextureWrapper} particlesStateTexture0
 * @param {WebGLTextureWrapper} particlesStateTexture1
 * @param {number} particleSize
 * @param {Float32Array} particleColor
 */
export function drawParticles(gl, program, buffer, indexBuffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aIndex']);
    bindTexture(gl, particlesStateTexture0, program.uniforms['sState0'], program.uniforms['uStateResolution'], 0);
    bindTexture(gl, particlesStateTexture1, program.uniforms['sState1'], null, 1);
    gl.uniform1f(program.uniforms['uParticleSize'], particleSize);
    gl.uniform4fv(program.uniforms['uParticleColor'], particleColor);
    gl.uniform2f(program.uniforms['uPixelSize'], 1 / gl.canvas.width, 1 / gl.canvas.height);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
    gl.drawElements(gl.TRIANGLES, indexBuffer.x, gl.UNSIGNED_SHORT, 0);
}