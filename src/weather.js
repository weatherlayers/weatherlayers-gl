import { createArrayTexture } from './webgl-common.js';
import { createOverlayProgram, createOverlayPositionBuffer, createOverlayTexture, drawOverlay } from './overlay.js';
import { initParticlesState, createParticlesProgram, createParticlesIndexBuffer, drawParticles } from './particles.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} metadata
 * @param {HTMLImageElement} image
 */
export function drawWeather(canvas, metadata, image) {
    const particlesCount = 1024;
    // const fadeOpacity = 0.996; // how fast the particle trails fade on each frame
    // const speedFactor = 0.25; // how fast the particles move
    // const dropRate = 0.003; // how often the particles move to a random place
    // const dropRateBump = 0.01; // drop rate increase relative to individual particle speed

    const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }));

    const particlesState = initParticlesState(particlesCount);

    // particles state textures, for the current and the previous state
    const particlesStateWidth = Math.ceil(Math.sqrt(particlesState.length / 4));
    let particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);
    let particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateWidth, particlesStateWidth);

    const overlayProgram = createOverlayProgram(gl);
    const overlayPositionBuffer = createOverlayPositionBuffer(gl);
    const overlayTexture = createOverlayTexture(gl, image);

    const particlesProgram = createParticlesProgram(gl);
    const particlesIndexBuffer = createParticlesIndexBuffer(gl, particlesCount);

    drawOverlay(gl, overlayProgram, overlayPositionBuffer, metadata, overlayTexture);
    drawParticles(gl, particlesProgram, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1);
}
