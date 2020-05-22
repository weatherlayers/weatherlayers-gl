import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { createStepProgram, createStepPositionBuffer, computeStep } from './step.js';
import { createFadeProgram, createFadeIndexBuffer, drawFade } from './fade.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';
import { createOverlayProgram, createOverlayPositionBuffer, drawOverlay } from './overlay.js';
import { createCopyProgram, createCopyIndexBuffer, drawCopy } from './copy.js';

/** @typedef {import('resize-observer-polyfill')} ResizeObserver */
/** @typedef {{ weatherMetadata: string; weatherImage: string; particlesCount: number; fadeOpacity: number; speedFactor: number; dropRate: number; dropRateBump: number; retina: boolean; }} MaritraceMapboxWeatherConfig */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MaritraceMapboxWeatherConfig} config
 */
export async function drawWeather(canvas, config) {
    const weatherMetadata = await (await fetch(config.weatherMetadata)).json();
    
    const weatherImage = new Image();
    weatherImage.src = config.weatherImage;
    await new Promise(resolve => weatherImage.onload = resolve);

    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));
    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    const weatherTexture = createImageTexture(gl, weatherImage);

    const particlesState = initParticlesState(config.particlesCount);

    // particles state textures, for the current and the previous state
    const particlesStateWidth = Math.ceil(Math.sqrt(particlesState.length / 4));
    let particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);
    let particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);

    // particles screen textures, for the current and the previous state
    /** @type ReturnType<createArrayTexture> */
    let particlesScreenTexture0;
    /** @type ReturnType<createArrayTexture> */
    let particlesScreenTexture1;
    /** @type ResizeObserver */
    let resizeObserver;
    function resize() {
        const dpi = config.retina ? window.devicePixelRatio : 1;

        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth * dpi;
            canvas.height = canvas.parentElement.clientHeight * dpi;
        }

        particlesScreenTexture0 = createArrayTexture(gl, null, canvas.width, canvas.height);
        particlesScreenTexture1 = createArrayTexture(gl, null, canvas.width, canvas.height);
    }
    function initResizeObserver() {
        if (canvas.parentElement && document.body.contains(canvas)) {
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(canvas.parentElement);
            } else {
                window.addEventListener('resize', resize);
            }
        }
    }
    function destroyResizeObserver() {
        if (canvas.parentElement && document.body.contains(canvas)) {
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver.disconnect();
            } else {
                window.removeEventListener('resize', resize);
            }
        }
    }
    initResizeObserver();
    resize();

    const stepProgram = createStepProgram(gl);
    const stepPositionBuffer = createStepPositionBuffer(gl);

    const fadeProgram = createFadeProgram(gl);
    const fadeIndexBuffer = createFadeIndexBuffer(gl);

    const particlesProgram = createParticlesProgram(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particlesCount);

    const overlayProgram = createOverlayProgram(gl);
    const overlayPositionBuffer = createOverlayPositionBuffer(gl);

    const copyProgram = createCopyProgram(gl);
    const copyIndexBuffer = createCopyIndexBuffer(gl);

    let playing = true;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    function draw() {
        // draw to particles state texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        computeStep(gl, stepProgram, stepPositionBuffer, particlesStateTexture0, weatherMetadata, weatherTexture, config.speedFactor, config.dropRate, config.dropRateBump);

        // draw to particles screen texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesScreenTexture1.texture, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawFade(gl, fadeProgram, fadeIndexBuffer, particlesScreenTexture0, config.fadeOpacity);
        drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1);

        // draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        drawOverlay(gl, overlayProgram, overlayPositionBuffer, weatherMetadata, weatherTexture);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        drawCopy(gl, copyProgram, copyIndexBuffer, particlesScreenTexture1);
        gl.disable(gl.BLEND);

        // swap particle state and screen textures
        [particlesStateTexture1, particlesStateTexture0] = [particlesStateTexture0, particlesStateTexture1];
        [particlesScreenTexture1, particlesScreenTexture0] = [particlesScreenTexture0, particlesScreenTexture1];
    }

    function run() {
        draw();
        if (playing) {
            raf = requestAnimationFrame(run);
        }
    }

    function play() {
        if (playing) {
            return;
        }

        playing = true;
        run();
    }

    function pause() {
        if (!playing) {
            return;
        }

        playing = false;
        if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
        }
    }

    function destroy() {
        stop();
        destroyResizeObserver();
    }

    run();

    return {
        get playing() {
            return playing;
        },
        play,
        pause,
        destroy
    }
}
