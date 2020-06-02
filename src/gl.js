import { loadImage } from './load.js';
import { getPixelRatio } from './pixel-ratio.js';
import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createStepProgram, computeStep } from './shaders/step.js';
import { createFadeProgram, drawFade } from './shaders/fade.js';
import { initParticlesState, createParticlesBuffer, createParticlesIndexBuffer, createParticlesProgram, drawParticles } from './shaders/particles.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { createCopyProgram, drawCopy } from './shaders/copy.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/** @typedef {{ weather: { image: string; min: number; max: number; }; particlesCount: number; particleSize: number; particleColor: [number, number, number]; particleOpacity: number; fadeOpacity: number; speedFactor: number; dropRate: number; dropRateBump: number; overlayOpacity: number; retina: boolean; backgroundColor: [number, number, number]; autoStart: boolean; }} MaritraceMapboxWeatherConfig */

/**
 * @param {WebGLRenderingContext} gl
 * @param {MaritraceMapboxWeatherConfig} config
 */
export async function drawToGl(gl, config) {
    // load weather files
    const weatherImage = await loadImage(config.weather.image);
    const weatherTexture = createImageTexture(gl, weatherImage);

    // particles state textures, for the current and the previous state
    /** @type WebGLBufferWrapper */
    let particlesBuffer;
    /** @type WebGLBufferWrapper */
    let particlesIndexBuffer;
    /** @type WebGLTextureWrapper */
    let particlesStateTexture0;
    /** @type WebGLTextureWrapper */
    let particlesStateTexture1;
    function updateConfig() {
        const particlesStateResolution = Math.ceil(Math.sqrt(config.particlesCount));
        const particlesState = initParticlesState(particlesStateResolution * particlesStateResolution);

        particlesBuffer = createParticlesBuffer(gl, config.particlesCount);
        particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particlesCount);
        particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
        particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
    }
    updateConfig();

    // particles screen textures, for the current and the previous state
    /** @type number */
    let pixelRatio;
    /** @type WebGLTextureWrapper */
    let particlesScreenTexture0;
    /** @type WebGLTextureWrapper */
    let particlesScreenTexture1;
    function resize() {
        pixelRatio = getPixelRatio(config.retina);

        const emptyTexture = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
        particlesScreenTexture0 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);
        particlesScreenTexture1 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);
    }
    resize();

    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    const quadBuffer = createQuadBuffer(gl);

    const stepProgram = createStepProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const overlayProgram = createOverlayProgram(gl);
    const copyProgram = createCopyProgram(gl);

    let running = false;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    /**
     * @param {Float32Array} matrix
     */
    function prerender(matrix) {
        const speedFactor = config.speedFactor * pixelRatio;
        const particleSize = config.particleSize * pixelRatio;
        const particleColor = new Float32Array([config.particleColor[0] / 255, config.particleColor[1] / 255, config.particleColor[2] / 255, config.particleOpacity]);

        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (blendEnabled) {
            gl.disable(gl.BLEND);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // draw to particles state texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        computeStep(gl, stepProgram, quadBuffer, particlesStateTexture0, weatherTexture, config.weather.min, config.weather.max, speedFactor, config.dropRate, config.dropRateBump);

        // draw to particles screen texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesScreenTexture1.texture, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawFade(gl, fadeProgram, quadBuffer, particlesScreenTexture0, config.fadeOpacity);
        drawParticles(gl, particlesProgram, particlesBuffer, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // swap particle state and screen textures
        [particlesStateTexture1, particlesStateTexture0] = [particlesStateTexture0, particlesStateTexture1];
        [particlesScreenTexture1, particlesScreenTexture0] = [particlesScreenTexture0, particlesScreenTexture1];

        if (blendEnabled) {
            gl.enable(gl.BLEND);
        }
    }

    /**
     * @param {Float32Array} matrix
     */
    function render(matrix) {
        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (!blendEnabled) {
            gl.enable(gl.BLEND);
        }

        if (config.backgroundColor) {
            gl.clearColor(config.backgroundColor[0] / 255, config.backgroundColor[1] / 255, config.backgroundColor[2] / 255, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // draw to canvas
        // gl.blendFunc(gl.ONE, gl.ZERO);
        // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        drawOverlay(gl, overlayProgram, quadBuffer, weatherTexture, config.weather.min, config.weather.max, config.overlayOpacity, new Float32Array(matrix));
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1);

        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }

    function frame() {
        const matrix = new Float32Array([
            2, 0, 0, 0,
            0, -2, 0, 0,
            0, 0, 1, 0,
            -1, 1, 0, 1,
        ]);
        prerender(matrix);
        render(matrix);
        if (running) {
            raf = requestAnimationFrame(frame);
        }
    }

    function start() {
        if (running) {
            return;
        }

        running = true;
        frame();
    }

    function stop() {
        if (!running) {
            return;
        }

        running = false;
        if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
        }
    }

    function destroy() {
        stop();
    }

    if (config.autoStart) {
        start();
    }

    return {
        get running() {
            return running;
        },
        set running(value) {
            if (value) {
                this.start();
            } else {
                this.stop();
            }
        },
        config,
        updateConfig,
        resize,
        prerender,
        render,
        start,
        stop,
        destroy,
    };
}
