import { createProgram, createBuffer, createElementBuffer, bindAttribute, bindTexture } from './webgl-common.js';
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
export function createParticlesElementBuffer(gl, particlesCount) {
    // indexes in particles state texture
    const particles = new Array(particlesCount).fill(undefined).map((_, i) => [4*i, 4*i+1, 4*i+2, 4*i+1, 4*i+2, 4*i+3]).flat();
    const particlesElementBuffer = createElementBuffer(gl, particles);
    return particlesElementBuffer;
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
 * @param {WebGLBufferWrapper} elementBuffer
 * @param {WebGLTextureWrapper} particlesStateTexture0
 * @param {WebGLTextureWrapper} particlesStateTexture1
 * @param {number} particleSize
 * @param {Float32Array} particleColor
 */
export function drawParticles(gl, program, buffer, elementBuffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor) {
    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aIndex']);
    bindTexture(gl, particlesStateTexture0, program.uniforms['sState'], program.uniforms['uStateResolution'], 0);
    gl.uniform2f(program.uniforms['uCanvasResolution'], gl.canvas.width, gl.canvas.height);
    gl.uniform1f(program.uniforms['uParticleSize'], particleSize);
    gl.uniform4fv(program.uniforms['uParticleColor'], particleColor);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer.buffer);
    gl.drawElements(gl.TRIANGLES, elementBuffer.x, gl.UNSIGNED_SHORT, 0);
}