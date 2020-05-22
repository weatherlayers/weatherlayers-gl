import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { createQuadBuffer } from './quad.js';
import { createStepProgram, computeStep } from './step.js';
import { createFadeProgram, drawFade } from './fade.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';
import { createOverlayProgram, drawOverlay } from './overlay.js';
import { createCopyProgram, drawCopy } from './copy.js';

/** @typedef {import('resize-observer-polyfill')} ResizeObserver */
/** @typedef {{ weatherMetadata: string; weatherImage: string; particlesCount: number; fadeOpacity: number; speedFactor: number; dropRate: number; dropRateBump: number; retina: boolean; }} MaritraceMapboxWeatherConfig */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MaritraceMapboxWeatherConfig} config
 */
export async function drawWeather(canvas, config) {
    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));
    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    // load weather files
    const weatherMetadata = await (await fetch(config.weatherMetadata)).json();
    const weatherImage = new Image();
    weatherImage.src = config.weatherImage;
    await new Promise(resolve => weatherImage.onload = resolve);
    const weatherTexture = createImageTexture(gl, weatherImage);

    // particles state textures, for the current and the previous state
    /** @type ReturnType<createArrayTexture> */
    let particlesStateTexture0;
    /** @type ReturnType<createArrayTexture> */
    let particlesStateTexture1;
    function updateConfig() {
        const particlesStateResolution = Math.ceil(Math.sqrt(config.particlesCount));
        const particlesState = initParticlesState(particlesStateResolution * particlesStateResolution);

        particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
        particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
    }
    updateConfig();

    // particles screen textures, for the current and the previous state
    /** @type ReturnType<createArrayTexture> */
    let particlesScreenTexture0;
    /** @type ReturnType<createArrayTexture> */
    let particlesScreenTexture1;
    /** @type ResizeObserver */
    let resizeObserver;
    function resize() {
        const pixelRatio = config.retina ? Math.max(Math.floor(window.devicePixelRatio) || 1, 2) : 1;

        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth * pixelRatio;
            canvas.height = canvas.parentElement.clientHeight * pixelRatio;
        }

        particlesScreenTexture0 = createArrayTexture(gl, null, canvas.width, canvas.height);
        particlesScreenTexture1 = createArrayTexture(gl, null, canvas.width, canvas.height);
    }
    function initResizeObserver() {
        if (canvas.parentElement) {
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(canvas.parentElement);
            } else {
                window.addEventListener('resize', resize);
            }
        }
    }
    function destroyResizeObserver() {
        if (canvas.parentElement) {
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver.disconnect();
            } else {
                window.removeEventListener('resize', resize);
            }
        }
    }
    initResizeObserver();
    resize();

    const quadBuffer = createQuadBuffer(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particlesCount);

    const stepProgram = createStepProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const overlayProgram = createOverlayProgram(gl);
    const copyProgram = createCopyProgram(gl);

    let playing = true;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    function draw() {
        // draw to particles state texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        computeStep(gl, stepProgram, quadBuffer, particlesStateTexture0, weatherMetadata, weatherTexture, config.speedFactor, config.dropRate, config.dropRateBump);

        // draw to particles screen texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesScreenTexture1.texture, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawFade(gl, fadeProgram, quadBuffer, particlesScreenTexture0, config.fadeOpacity);
        drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1);

        // draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        drawOverlay(gl, overlayProgram, quadBuffer, weatherMetadata, weatherTexture);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1);
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
        config,
        updateConfig,
        resize,
        play,
        pause,
        destroy
    }
}
