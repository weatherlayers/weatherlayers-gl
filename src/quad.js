import { createBuffer } from './webgl-common.js';

/** @typedef { import('./webgl-common.js').WebGLBufferWrapper } WebGLBufferWrapper */

/**
 * @param {WebGLRenderingContext} gl
 * @return {WebGLBufferWrapper}
 */
export function createQuadBuffer(gl) {
    // quad = 2 triangles, 4 triangle strip vertices (top left, bottom left, top right, bottom right)
    const quadPosition = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const quadPositionBuffer = createBuffer(gl, quadPosition);
    return quadPositionBuffer;
}