import { createProgram, createImageTexture, createBuffer, bindAttribute, bindTexture } from './webgl-common.js';
import overlayVertexShaderSource from './shaders/overlay.vert';
import overlayFragmentShaderSource from './shaders/overlay.frag';

/** @typedef { import('./webgl-common.js').WebGLProgramWrapper } WebGLProgramWrapper */
/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */
/** @typedef { import('./webgl-common.js').WebGLTextureWrapper } WebGLTextureWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLProgramWrapper}
 */
export function createOverlayProgram(gl) {
    return createProgram(gl, overlayVertexShaderSource, overlayFragmentShaderSource);
}

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLBufferWrapper}
 */
export function createOverlayPositionBuffer(gl) {
    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const overlayPosition = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const overlayPositionBuffer = createBuffer(gl, overlayPosition);
    return overlayPositionBuffer;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {HTMLImageElement} image
 * @return {WebGLTextureWrapper}
 */
export function createOverlayTexture(gl, image) {
    return createImageTexture(gl, image);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgramWrapper} overlayProgram
 * @param {WebGLBufferWrapper} overlayPositionBuffer
 * @param {Record<string, any>} metadata
 * @param {WebGLTextureWrapper} texture
 */
export function drawOverlay(gl, overlayProgram, overlayPositionBuffer, metadata, texture) {
    // convert dst pixel coords to clipspace coords
    // https://stackoverflow.com/questions/12250953/drawing-an-image-using-webgl
    const dstX = 0;
    const dstY = 0;
    const dstWidth = 1440;
    const dstHeight = 720;
    const clipX = dstX / gl.canvas.width  *  2 - 1;
    const clipY = dstY / gl.canvas.height * -2 + 1;
    const clipWidth = dstWidth   / gl.canvas.width  *  2;
    const clipHeight = dstHeight / gl.canvas.height * -2;
    const matrix = [
        clipWidth, 0, 0,
        0, clipHeight, 0,
        clipX, clipY, 1,
    ];

    gl.useProgram(overlayProgram.program);
    bindAttribute(gl, overlayPositionBuffer.buffer, overlayProgram.attributes['aPosition'], overlayPositionBuffer.y);
    bindTexture(gl, texture.texture, 0);
    gl.uniformMatrix3fv(overlayProgram.uniforms['uMatrix'], false, matrix);
    gl.uniform1i(overlayProgram.uniforms['sImage'], 0);
    gl.uniform1f(overlayProgram.uniforms['uMin'], metadata.min);
    gl.uniform1f(overlayProgram.uniforms['uMax'], metadata.max);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, overlayPositionBuffer.x);
}