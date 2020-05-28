import { getPixelRatio } from './pixel-ratio.js';
import { drawToGl } from './gl.js';

/** @typedef {import('resize-observer-polyfill')} ResizeObserver */
/** @typedef {import('./gl.js').MaritraceMapboxWeatherConfig} MaritraceMapboxWeatherConfig */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MaritraceMapboxWeatherConfig} config
 */
export async function drawToCanvas(canvas, config) {
    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true }));
    const maritraceMapboxWeather = await drawToGl(gl, config);

    /** @type number */
    let pixelRatio;
    /** @type ResizeObserver | undefined */
    let resizeObserver;
    function resize() {
        pixelRatio = getPixelRatio(config.retina);

        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth * pixelRatio;
            canvas.height = canvas.parentElement.clientHeight * pixelRatio;
        }

        maritraceMapboxWeather.resize();
    }
    function initResizeObserver() {
        if (canvas.parentElement) {
            if (typeof window.ResizeObserver !== 'undefined') {
                resizeObserver = new window.ResizeObserver(resize);
                resizeObserver.observe(canvas.parentElement);
            } else {
                window.addEventListener('resize', resize);
            }
        }
    }
    function destroyResizeObserver() {
        if (canvas.parentElement) {
            if (typeof window.ResizeObserver !== 'undefined') {
                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            } else {
                window.removeEventListener('resize', resize);
            }
        }
    }
    initResizeObserver();
    resize();

    return Object.assign(Object.create(maritraceMapboxWeather), {
        resize,
        destroy() {
            destroyResizeObserver();
            super.destroy();
        },
    });
}