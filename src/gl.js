import { getPixelRatio } from './pixel-ratio.js';
import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createStepProgram, computeStep } from './shaders/step.js';
import { createFadeProgram, drawFade } from './shaders/fade.js';
import { createParticlesBuffer, createParticlesIndexBuffer, createParticlesProgram, drawParticles } from './shaders/particles.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { createCopyProgram, drawCopy } from './shaders/copy.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/** @typedef {{ weather: { image: HTMLImageElement; min: number; max: number; }; particlesCount: number; particleSize: number; particleColor: [number, number, number]; particleOpacity: number; fadeOpacity: number; speedFactor: number; dropRate: number; dropRateBump: number; overlayOpacity: number; overlayColorRamp: [number, number, number][]; retina: boolean; backgroundColor: [number, number, number]; autoStart: boolean; }} MaritraceMapboxWeatherConfig */

/**
 * @param {WebGLRenderingContext} gl
 * @param {MaritraceMapboxWeatherConfig} config
 */
export function drawToGl(gl, config) {
    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    const stepProgram = createStepProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const overlayProgram = createOverlayProgram(gl);
    const copyProgram = createCopyProgram(gl);

    const quadBuffer = createQuadBuffer(gl);
    const weatherTexture = createImageTexture(gl, config.weather.image);
    const overlayColorRampTexture = createArrayTexture(gl, new Uint8Array(config.overlayColorRamp.flat()), 16, 16);

    let initialized = false;
    let running = false;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    /** @type number */
    let pixelRatio;
    
    /** @type WebGLBufferWrapper */
    let particlesBuffer;
    /** @type WebGLBufferWrapper */
    let particlesIndexBuffer;

    // particles state textures, for the current and the previous state
    /** @type WebGLTextureWrapper */
    let particlesStateTexture0;
    /** @type WebGLTextureWrapper */
    let particlesStateTexture1;

    // particles screen textures, for the current and the previous state
    /** @type WebGLTextureWrapper */
    let particlesScreenTexture0;
    /** @type WebGLTextureWrapper */
    let particlesScreenTexture1;

    function resize() {
        if (initialized) {
            gl.deleteBuffer(particlesBuffer.buffer);
            gl.deleteBuffer(particlesIndexBuffer.buffer);
            gl.deleteTexture(particlesStateTexture0.texture);
            gl.deleteTexture(particlesStateTexture1.texture);
            gl.deleteTexture(particlesScreenTexture0.texture);
            gl.deleteTexture(particlesScreenTexture1.texture);
        }

        pixelRatio = getPixelRatio(config.retina);

        particlesBuffer = createParticlesBuffer(gl, config.particlesCount);
        particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particlesCount);

        const particlesStateResolution = Math.ceil(Math.sqrt(config.particlesCount));
        const particlesState = new Uint8Array(particlesStateResolution * particlesStateResolution * 4);        
        particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
        particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);

        const emptyTexture = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
        particlesScreenTexture0 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);
        particlesScreenTexture1 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);

        initialized = true;
    }
    resize();

    /**
     * @param {number[]} matrix
     * @param {[[number, number], [number, number]]} worldBounds
     * @param {number[]} worldOffsets
     */
    function prerender(matrix, worldBounds, worldOffsets) {
        const speedFactor = config.speedFactor * pixelRatio;
        const particleSize = config.particleSize * pixelRatio;
        const particleColor = /** @type [number, number, number, number] */ ([config.particleColor[0] / 255, config.particleColor[1] / 255, config.particleColor[2] / 255, config.particleOpacity]);

        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (blendEnabled) {
            gl.disable(gl.BLEND);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // draw to particles state texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        computeStep(gl, stepProgram, quadBuffer, particlesStateTexture0, weatherTexture, config.weather.min, config.weather.max, speedFactor, config.dropRate, config.dropRateBump, worldBounds);

        // const particlesStateResolution = Math.ceil(Math.sqrt(config.particlesCount));
        // const state = new Uint8Array(particlesStateResolution * particlesStateResolution * 4);
        // gl.readPixels(0, 0, particlesStateResolution, particlesStateResolution, gl.RGBA, gl.UNSIGNED_BYTE, state);
        // const positions = new Array(particlesStateResolution * particlesStateResolution).fill(undefined).map((_, i) => {
        //     return [
        //         state[i * 4] / 255 / 255 + state[i * 4 + 2] / 255,
        //         state[i * 4 + 1] / 255 / 255 + state[i * 4 + 3] / 255
        //     ];
        // }).flat();
        // console.log(positions);

        // draw to particles screen texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesScreenTexture1.texture, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawFade(gl, fadeProgram, quadBuffer, particlesScreenTexture0, config.fadeOpacity);
        for (let worldOffset of worldOffsets) {
            drawParticles(gl, particlesProgram, particlesBuffer, particlesIndexBuffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor, matrix, worldOffset);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // swap particle state and screen textures
        [particlesStateTexture1, particlesStateTexture0] = [particlesStateTexture0, particlesStateTexture1];
        [particlesScreenTexture1, particlesScreenTexture0] = [particlesScreenTexture0, particlesScreenTexture1];

        if (blendEnabled) {
            gl.enable(gl.BLEND);
        }
    }

    /**
     * @param {number[]} matrix
     * @param {number[]} worldOffsets
     */
    function render(matrix, worldOffsets) {
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
            drawOverlay(gl, overlayProgram, quadBuffer, weatherTexture, config.weather.min, config.weather.max, config.overlayOpacity, overlayColorRampTexture, matrix, worldOffset);
        }
        drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1);

        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }

    function frame() {
        const matrix = [
            2, 0, 0, 0,
            0, -2, 0, 0,
            0, 0, 1, 0,
            -1, 1, 0, 1,
        ];
        const worldBounds = /** @type [[number, number], [number, number]] */ ([[0, 0], [1, 1]]);
        const worldOffsets = [0];
        prerender(matrix, worldBounds, worldOffsets);
        render(matrix, worldOffsets);
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

        gl.deleteFramebuffer(framebuffer);

        gl.deleteProgram(stepProgram.program);
        gl.deleteProgram(fadeProgram.program);
        gl.deleteProgram(particlesProgram.program);
        gl.deleteProgram(overlayProgram.program);
        gl.deleteProgram(copyProgram.program);

        gl.deleteBuffer(quadBuffer.buffer);
        gl.deleteTexture(weatherTexture.texture);
        gl.deleteTexture(overlayColorRampTexture.texture);

        gl.deleteBuffer(particlesBuffer.buffer);
        gl.deleteBuffer(particlesIndexBuffer.buffer);
        gl.deleteTexture(particlesStateTexture0.texture);
        gl.deleteTexture(particlesStateTexture1.texture);
        gl.deleteTexture(particlesScreenTexture0.texture);
        gl.deleteTexture(particlesScreenTexture1.texture);
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
        resize,
        prerender,
        render,
        start,
        stop,
        destroy,
    };
}
