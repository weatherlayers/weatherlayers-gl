import { createImageTexture } from './webgl-common.js';
import { colorRampCanvas } from './color-ramp.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { createImageCanvas } from './create-image-canvas.js';
import { texture2DBilinear } from './texture-2d-bilinear.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      image: HTMLImageElement;
 *      bounds: [number, number];
 *      colorFunction: (i: number) => (string | [number, number, number]);
 *      opacity: number;
 *      backgroundColor: [number, number, number];
 *      legendTitle: string;
 *      legendTicksCount: number;
 *      legendWidth: number;
 *      minZoom: number;
 *      maxZoom: number;
 * }} OverlayConfig
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {OverlayConfig} config
 */
export function overlayGl(gl, config) {
    const overlayProgram = createOverlayProgram(gl);

    const quadBuffer = createQuadBuffer(gl);

    let initialized = false;

    /** @type HTMLCanvasElement */
    let sourceCanvas;
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
        sourceTexture = createImageTexture(gl, config.image);

        const overlayColorRampCanvas = colorRampCanvas(config.colorFunction);
        overlayColorRampTexture = createImageTexture(gl, overlayColorRampCanvas);

        initialized = true;
    }
    update();

    /**
     * @param {number[]} matrix
     * @param {number[]} worldOffsets
     */
    function render(matrix, worldOffsets) {
        if (!initialized) {
            return;
        }
        
        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (!blendEnabled) {
            gl.enable(gl.BLEND);
        }

        if (config.backgroundColor) {
            gl.clearColor(config.backgroundColor[0] / 255, config.backgroundColor[1] / 255, config.backgroundColor[2] / 255, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // draw to canvas
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        for (let worldOffset of worldOffsets) {
            drawOverlay(gl, overlayProgram, quadBuffer, sourceTexture, overlayColorRampTexture, config.opacity, matrix, worldOffset);
        }

        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }

    function destroy() {
        gl.deleteProgram(overlayProgram.program);

        gl.deleteBuffer(quadBuffer.buffer);

        gl.deleteTexture(sourceTexture.texture);
        gl.deleteTexture(overlayColorRampTexture.texture);
    }

    /**
     * @param {[number, number]} position
     * @return {number}
     */
    function getPositionValue(position) {
        const ctx = /** @type CanvasRenderingContext2D */ (sourceCanvas.getContext('2d'));

        const color = texture2DBilinear(ctx, position);
        const value = color[0] / 255 * (config.bounds[1] - config.bounds[0]) + config.bounds[0];

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
