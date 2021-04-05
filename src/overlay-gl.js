import { createBuffer, createTexture } from './webgl-common.js';
import { colorRampCanvas } from './color-ramp.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { getPositionValues } from './get-position-values.js';
import { hasValues } from './has-values.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      image: { data: Float32Array, width: number, height: number, numDimensions: number };
 *      bounds: [number, number];
 *      colorFunction: (i: number) => (string | [number, number, number]);
 *      opacity: number;
 *      legendWidth: number;
 *      legendTitle: string;
 *      legendTicksCount: number;
 *      legendValueFormat?: (value: number) => number;
 *      legendValueDecimals?: number;
 *      minZoom?: number;
 *      maxZoom?: number;
 * }} OverlayConfig
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {OverlayConfig} config
 */
export function overlayGl(gl, config) {
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');

    const overlayProgram = createOverlayProgram(gl);

    let initialized = false;

    /** @type WebGLTextureWrapper */
    let sourceTexture;

    /** @type WebGLTextureWrapper */
    let overlayColorRampTexture;

    function update() {
        if (!config.image) {
            initialized = false;
            return;
        }

        if (initialized) {
            gl.deleteTexture(sourceTexture.texture);
            gl.deleteTexture(overlayColorRampTexture.texture);

            initialized = false;
        }

        sourceTexture = createTexture(gl, config.image.data, gl.LINEAR, config.image.width, config.image.height);

        const overlayColorRampCanvas = colorRampCanvas(config.colorFunction);
        overlayColorRampTexture = createTexture(gl, overlayColorRampCanvas, gl.LINEAR, overlayColorRampCanvas.width, overlayColorRampCanvas.height);

        initialized = true;
    }
    update();

    /**
     * @param {number[]} matrix
     * @param {[[number, number], [number, number]]} worldBounds
     */
    function render(matrix, worldBounds) {
        if (!initialized) {
            return;
        }
        
        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (!blendEnabled) {
            gl.enable(gl.BLEND);
        }
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // draw to canvas
        const overlayBuffer = createBuffer(gl, [
            [worldBounds[0][0], worldBounds[0][1]], // [0, 0]
            [worldBounds[0][0], worldBounds[1][1]], // [0, 1]
            [worldBounds[1][0], worldBounds[0][1]], // [1, 0]
            [worldBounds[1][0], worldBounds[1][1]], // [1, 1]
        ]);
        drawOverlay(gl, overlayProgram, overlayBuffer, sourceTexture, config.bounds, overlayColorRampTexture, config.opacity, matrix);
        gl.deleteBuffer(overlayBuffer.buffer);

        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }

    function destroy() {
        gl.deleteProgram(overlayProgram.program);

        gl.deleteTexture(sourceTexture.texture);
        gl.deleteTexture(overlayColorRampTexture.texture);
    }

    /**
     * @param {[number, number]} position
     * @return {number | undefined}
     */
    function getPositionValue(position) {
        const values = getPositionValues(config.image, position);
        if (!hasValues(values)) {
            return;
        }

        const value = values[0];

        return value;
    }

    return {
        config,
        update,
        render,
        destroy,
        getPositionValue,
    };
}
