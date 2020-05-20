
import { createProgram, createImageTexture, createBuffer, bindAttribute, bindTexture, bindFramebuffer } from './webgl-common.js';
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
 * @param {WebGLFramebuffer} stepFramebuffer
 * @param {WebGLTextureWrapper} particlesStateTexture0
 * @param {WebGLTextureWrapper} particlesStateTexture1
 * @param {Record<string, any>} weatherMetadata
 * @param {WebGLTextureWrapper} weatherTexture
 */
export function computeStep(gl, stepProgram, stepPositionBuffer, stepFramebuffer, particlesStateTexture0, particlesStateTexture1, weatherMetadata, weatherTexture) {
    bindFramebuffer(gl, stepFramebuffer, particlesStateTexture1.texture);
    gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);

    gl.useProgram(stepProgram.program);
    bindAttribute(gl, stepPositionBuffer.buffer, stepProgram.attributes['aPosition'], stepPositionBuffer.y);
    bindTexture(gl, particlesStateTexture0.texture, 0);
    bindTexture(gl, weatherTexture.texture, 1);
    gl.uniform1i(stepProgram.uniforms['sState'], 0);
    gl.uniform2f(stepProgram.uniforms['uStateDimensions'], particlesStateTexture0.x, particlesStateTexture0.y);
    gl.uniform1i(stepProgram.uniforms['sWeather'], 0);
    gl.uniform2f(stepProgram.uniforms['uWeatherResolution'], weatherTexture.x, weatherTexture.y);
    gl.uniform1f(stepProgram.uniforms['uWeatherMin'], weatherMetadata.min);
    gl.uniform1f(stepProgram.uniforms['uWeatherMax'], weatherMetadata.max);
    gl.uniform1f(stepProgram.uniforms['uSpeedFactor'], 0.25);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, stepPositionBuffer.x);

    bindFramebuffer(gl, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}