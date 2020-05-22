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
 * @param {WebGLTextureWrapper} particlesStateTexture0
 * @param {WebGLTextureWrapper} particlesStateTexture1
 */
export function drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1) {
    gl.useProgram(particlesProgram.program);
    bindAttribute(gl, particlesIndexBuffer, particlesProgram.attributes['aIndex']);
    bindTexture(gl, particlesStateTexture0, particlesProgram.uniforms['sState'], particlesProgram.uniforms['uStateResolution'], 0);
    gl.drawArrays(gl.POINTS, 0, particlesIndexBuffer.x);
}