import { getPixelRatio } from './pixel-ratio.js';
import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { colorRampCanvas } from './color-ramp.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createStepProgram, computeStep } from './shaders/step.js';
import { createFadeProgram, drawFade } from './shaders/fade.js';
import { createParticlesBuffer, createParticlesIndexBuffer, createParticlesProgram, drawParticles } from './shaders/particles.js';
import { createOverlayProgram, drawOverlay } from './shaders/overlay.js';
import { createCopyProgram, drawCopy } from './shaders/copy.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      source: {
 *          image: HTMLImageElement;
 *      };
 *      overlay: {
 *          bounds: [number, number];
 *          colorFunction: (i: number) => (string | [number, number, number]);
 *          opacity: number;
 *          legendTitle: string;
 *          legendTicksCount: number;
 *          legendWidth: number;
 *      };
 *      particles: {
 *          bounds: [number, number];
 *          count: number;
 *          size: number;
 *          color: [number, number, number];
 *          opacity: number;
 *          speedFactor: number;
 *          dropRate: number;
 *          dropRateBump: number;
 *          fadeOpacity: number;
 *      };
 *      retina: boolean;
 *      minZoom: number;
 *      maxZoom: number;
 *      backgroundColor: [number, number, number];
 *      autoStart: boolean;
 * }} MaritraceMapboxWeatherConfig
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {MaritraceMapboxWeatherConfig} config
 */
export function drawToGl(gl, config) {
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
        console.log('OES_texture_float WebGL extension is required');
        return;
    }

    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    const stepProgram = createStepProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const overlayProgram = createOverlayProgram(gl);
    const copyProgram = createCopyProgram(gl);

    const quadBuffer = createQuadBuffer(gl);

    let initialized = false;
    let initializedParticles = false;
    let running = false;
    let raf = /** @type ReturnType<requestAnimationFrame> | null */ (null);

    /** @type number */
    let pixelRatio;

    /** @type WebGLTextureWrapper */
    let sourceTexture;

    /** @type WebGLTextureWrapper */
    let overlayColorRampTexture;
    
    /** @type boolean */
    let particlesEnabled;

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
            gl.deleteTexture(sourceTexture.texture);
            gl.deleteTexture(overlayColorRampTexture.texture);

            initialized = false;

            if (initializedParticles) {
                gl.deleteBuffer(particlesBuffer.buffer);
                gl.deleteBuffer(particlesIndexBuffer.buffer);
                gl.deleteTexture(particlesStateTexture0.texture);
                gl.deleteTexture(particlesStateTexture1.texture);
                gl.deleteTexture(particlesScreenTexture0.texture);
                gl.deleteTexture(particlesScreenTexture1.texture);

                initializedParticles = false;
            }
        }

        pixelRatio = getPixelRatio(config.retina);

        sourceTexture = createImageTexture(gl, config.source.image);

        const overlayColorRampCanvas = colorRampCanvas(config.overlay.colorFunction);
        overlayColorRampTexture = createImageTexture(gl, overlayColorRampCanvas);

        initialized = true;

        particlesEnabled = config.particles && config.particles.count > 0;

        if (particlesEnabled) {
            particlesBuffer = createParticlesBuffer(gl, config.particles.count);
            particlesIndexBuffer = createParticlesIndexBuffer(gl, config.particles.count);

            const particlesStateResolution = Math.ceil(Math.sqrt(config.particles.count));
            const particlesState = new Float32Array(particlesStateResolution * particlesStateResolution * 4);
            particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
            particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);

            const emptyTexture = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
            particlesScreenTexture0 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);
            particlesScreenTexture1 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);

            initializedParticles = true;
        }
    }
    resize();

    /**
     * @param {number[]} matrix
     * @param {number} zoom
     * @param {[[number, number], [number, number]]} worldBounds
     * @param {number[]} worldOffsets
     */
    function prerender(matrix, zoom, worldBounds, worldOffsets) {
        if (!particlesEnabled) {
            return;
        }

        const speedFactor = config.particles.speedFactor * pixelRatio / 1.8 ** zoom;
        const particleSize = config.particles.size * pixelRatio;
        const particleColor = /** @type [number, number, number, number] */ ([config.particles.color[0] / 255, config.particles.color[1] / 255, config.particles.color[2] / 255, config.particles.opacity]);

        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (blendEnabled) {
            gl.disable(gl.BLEND);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // draw to particles state texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        computeStep(gl, stepProgram, quadBuffer, particlesStateTexture0, sourceTexture, config.particles.bounds, speedFactor, config.particles.dropRate, config.particles.dropRateBump, worldBounds);

        // const particlesStateResolution = Math.ceil(Math.sqrt(config.particles.count));
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
        drawFade(gl, fadeProgram, quadBuffer, particlesScreenTexture0, config.particles.fadeOpacity);
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
            drawOverlay(gl, overlayProgram, quadBuffer, sourceTexture, overlayColorRampTexture, config.overlay.opacity, matrix, worldOffset);
        }

        if (particlesEnabled) {
            drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1);
        }

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
        prerender(matrix, 0, worldBounds, worldOffsets);
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

        gl.deleteTexture(sourceTexture.texture);
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
