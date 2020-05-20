import { createProgram, createBuffer, bindAttribute, bindTexture } from './webgl-common.js';
import particlesVertexShaderSource from './shaders/particles.vert';
import particlesFragmentShaderSource from './shaders/particles.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

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
 * @return {WebGLProgramWrapper}
 */
export function createParticlesProgram(gl) {
    return createProgram(gl, particlesVertexShaderSource, particlesFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} particlesCount
 * @return {WebGLBufferWrapper}
 */
export function createParticlesIndexBuffer(gl, particlesCount) {
    // indexes in particles state texture
    const particlesIndex = new Array(particlesCount).fill(undefined).map((_, i) => i);
    const particlesIndexBuffer = createBuffer(gl, particlesIndex);
    return particlesIndexBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} particlesProgram
 * @param {WebGLBufferWrapper} particlesIndexBuffer
 * @param {WebGLTextureWrapper} particlesStateTexture
 */
export function drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture) {
    gl.useProgram(particlesProgram.program);
    bindAttribute(gl, particlesIndexBuffer.buffer, particlesProgram.attributes['aIndex'], particlesIndexBuffer.y);
    bindTexture(gl, particlesStateTexture.texture, 0);
    gl.uniform1i(particlesProgram.uniforms['sState'], 0);
    gl.uniform2f(particlesProgram.uniforms['uStateResolution'], particlesStateTexture.x, particlesStateTexture.y);
    gl.drawArrays(gl.POINTS, 0, particlesIndexBuffer.x);
}