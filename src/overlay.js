import { createProgram, bindAttribute, bindTexture } from './webgl-common.js';
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
 * @param {WebGLProgramWrapper} program
 * @param {WebGLBufferWrapper} buffer
 * @param {Record<string, any>} weatherMetadata
 * @param {WebGLTextureWrapper} weatherTexture
 */
export function drawOverlay(gl, program, buffer, weatherMetadata, weatherTexture) {
    // convert dst pixel coords to clipspace coords
    // https://stackoverflow.com/questions/12250953/drawing-an-image-using-webgl
    const dstX = 0;
    const dstY = 0;
    const dstWidth = gl.canvas.width;
    const dstHeight = gl.canvas.height;
    const clipX = dstX / gl.canvas.width  *  2 - 1;
    const clipY = dstY / gl.canvas.height * -2 + 1;
    const clipWidth = dstWidth   / gl.canvas.width  *  2;
    const clipHeight = dstHeight / gl.canvas.height * -2;
    const matrix = [
        clipWidth, 0, 0,
        0, clipHeight, 0,
        clipX, clipY, 1,
    ];

    gl.useProgram(program.program);
    bindAttribute(gl, buffer, program.attributes['aPosition']);
    bindTexture(gl, weatherTexture, program.uniforms['sWeather'], program.uniforms['uWeatherResolution'], 0);
    gl.uniformMatrix3fv(program.uniforms['uMatrix'], false, matrix);
    gl.uniform1f(program.uniforms['uWeatherMin'], weatherMetadata.min);
    gl.uniform1f(program.uniforms['uWeatherMax'], weatherMetadata.max);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.x);
}