import { createImageTexture, createBuffer } from './webgl-common.js';
import { colorRampCanvas } from './color-ramp.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { createImageCanvas } from './create-image-canvas.js';
import { getPositionValues } from './get-position-values.js';
import { hasValues } from './has-values.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      image: HTMLImageElement;
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
    const overlayProgram = createOverlayProgram(gl);

    let initialized = false;

    /** @type HTMLCanvasElement */
    let sourceCanvas;
    /** @type CanvasRenderingContext2D */
    let sourceCtx;
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

        sourceCanvas = createImageCanvas(config.image);
        sourceCtx = /** @type CanvasRenderingContext2D */ (sourceCanvas.getContext('2d'));
        sourceTexture = createImageTexture(gl, config.image);

        const overlayColorRampCanvas = colorRampCanvas(config.colorFunction);
        overlayColorRampTexture = createImageTexture(gl, overlayColorRampCanvas);

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
        drawOverlay(gl, overlayProgram, overlayBuffer, sourceTexture, overlayColorRampTexture, config.opacity, matrix);
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
        const values = getPositionValues(sourceCtx, position);
        if (!hasValues(values)) {
            return;
        }

        const value = values[0] / 255 * (config.bounds[1] - config.bounds[0]) + config.bounds[0];

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
