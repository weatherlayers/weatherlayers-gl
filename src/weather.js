import { createImageTexture, createArrayTexture, createFramebuffer, bindFramebuffer } from './webgl-common.js';
import { createStepProgram, createStepPositionBuffer, computeStep } from './step.js';
import { createFadeProgram, createFadeIndexBuffer, drawFade } from './fade.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';
import { createOverlayProgram, createOverlayPositionBuffer, drawOverlay } from './overlay.js';
import { createCopyProgram, createCopyIndexBuffer, drawCopy } from './copy.js';

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

    const dpi = config.retina ? window.devicePixelRatio : 1;

    // TODO: resize canvas on window resize?
    canvas.width = /** @type HTMLElement */ (canvas.parentElement).clientWidth * dpi;
    canvas.height = /** @type HTMLElement */ (canvas.parentElement).clientHeight * dpi;

    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));

    const weatherTexture = createImageTexture(gl, weatherImage);

    const particlesState = initParticlesState(config.particlesCount);

    // particles state textures, for the current and the previous state
    const particlesStateWidth = Math.ceil(Math.sqrt(particlesState.length / 4));
    let particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);
    let particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);

    // particles screen textures, for the current and the previous state
    let particlesScreenTexture0 = createArrayTexture(gl, null, gl.canvas.width, gl.canvas.height);
    let particlesScreenTexture1 = createArrayTexture(gl, null, gl.canvas.width, gl.canvas.height);

    const stepProgram = createStepProgram(gl);
    const stepPositionBuffer = createStepPositionBuffer(gl);
    const stepFramebuffer = createFramebuffer(gl);

    const fadeProgram = createFadeProgram(gl);
    const fadeIndexBuffer = createFadeIndexBuffer(gl);

    const particlesProgram = createParticlesProgram(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particlesCount);
    const particlesFramebuffer = createFramebuffer(gl);

    const overlayProgram = createOverlayProgram(gl);
    const overlayPositionBuffer = createOverlayPositionBuffer(gl);

    const copyProgram = createCopyProgram(gl);
    const copyIndexBuffer = createCopyIndexBuffer(gl);

    let playing = true;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    function draw() {
        bindFramebuffer(gl, stepFramebuffer, particlesStateTexture1.texture);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        computeStep(gl, stepProgram, stepPositionBuffer, particlesStateTexture0, weatherMetadata, weatherTexture, config.speedFactor, config.dropRate, config.dropRateBump);

        bindFramebuffer(gl, particlesFramebuffer, particlesScreenTexture1.texture);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawFade(gl, fadeProgram, fadeIndexBuffer, particlesScreenTexture0, config.fadeOpacity);
        drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1);

        bindFramebuffer(gl, null);
        drawOverlay(gl, overlayProgram, overlayPositionBuffer, weatherMetadata, weatherTexture);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        drawCopy(gl, copyProgram, copyIndexBuffer, particlesScreenTexture1);
        gl.disable(gl.BLEND);

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

    run();

    return {
        get playing() {
            return playing;
        },
        play,
        pause
    }
}
