import { createImageTexture, createArrayTexture, createFramebuffer } from './webgl-common.js';
import { createOverlayProgram, createOverlayPositionBuffer, drawOverlay } from './overlay.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';
import { createStepProgram, createStepPositionBuffer, computeStep } from './step.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} weatherMetadata
 * @param {HTMLImageElement} weatherImage
 */
export function drawWeather(canvas, weatherMetadata, weatherImage) {
    const particlesCount = 1024 * 64;
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

    const overlayProgram = createOverlayProgram(gl);
    const overlayPositionBuffer = createOverlayPositionBuffer(gl);

    const particlesProgram = createParticlesProgram(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, particlesCount);

    const stepProgram = createStepProgram(gl);
    const stepPositionBuffer = createStepPositionBuffer(gl);
    const stepFramebuffer = createFramebuffer(gl);

    let playing = true;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    function draw() {
        drawOverlay(gl, overlayProgram, overlayPositionBuffer, weatherMetadata, weatherTexture);
        drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0);

        computeStep(gl, stepProgram, stepPositionBuffer, stepFramebuffer, particlesStateTexture0, particlesStateTexture1, weatherMetadata, weatherTexture);

        const temp = particlesStateTexture0;
        particlesStateTexture0 = particlesStateTexture1;
        particlesStateTexture1 = temp;
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
