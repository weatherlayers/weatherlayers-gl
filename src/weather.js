import { createImageTexture, createArrayTexture, createFramebuffer } from './webgl-common.js';
import { createOverlayProgram, createOverlayPositionBuffer, drawOverlay } from './overlay.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';
import { createStepProgram, createStepPositionBuffer, computeStep } from './step.js';
import { createFadeProgram, createFadeIndexBuffer, drawFade } from './fade.js';
import { createCopyProgram, createCopyIndexBuffer, drawCopy } from './copy.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} weatherMetadata
 * @param {HTMLImageElement} weatherImage
 */
export function drawWeather(canvas, weatherMetadata, weatherImage) {
    const particlesCount = 1024 * 4;
    // const fadeOpacity = 0.996; // how fast the particle trails fade on each frame
    // const speedFactor = 0.25; // how fast the particles move
    // const dropRate = 0.003; // how often the particles move to a random place
    // const dropRateBump = 0.01; // drop rate increase relative to individual particle speed

    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));

    const weatherTexture = createImageTexture(gl, weatherImage);

    const particlesState = initParticlesState(particlesCount);

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

    const overlayProgram = createOverlayProgram(gl);
    const overlayPositionBuffer = createOverlayPositionBuffer(gl);

    const particlesProgram = createParticlesProgram(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, particlesCount);
    const particlesFramebuffer = createFramebuffer(gl);

    const fadeProgram = createFadeProgram(gl);
    const fadeIndexBuffer = createFadeIndexBuffer(gl);

    const copyProgram = createCopyProgram(gl);
    const copyIndexBuffer = createCopyIndexBuffer(gl);

    let playing = true;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    function draw() {
        computeStep(gl, stepProgram, stepFramebuffer, stepPositionBuffer, particlesStateTexture0, particlesStateTexture1, weatherMetadata, weatherTexture);

        drawOverlay(gl, overlayProgram, overlayPositionBuffer, weatherMetadata, weatherTexture);

        drawFade(gl, fadeProgram, particlesFramebuffer, fadeIndexBuffer, particlesScreenTexture0, particlesScreenTexture1);
        drawParticles(gl, particlesProgram, particlesFramebuffer, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1, particlesScreenTexture0, particlesScreenTexture1);

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
