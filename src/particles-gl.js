import { getPixelRatio } from './get-pixel-ratio.js';
import { createImageTexture, createArrayTexture } from './webgl-common.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createStepProgram, computeStep } from './shaders/step.js';
import { createFadeProgram, drawFade } from './shaders/fade.js';
import { createParticlesBuffer, createParticlesIndexBuffer, createParticlesProgram, drawParticles } from './shaders/particles.js';
import { createCopyProgram, drawCopy } from './shaders/copy.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      image: HTMLImageElement;
 *      bounds: [number, number];
 *      count: number;
 *      size: number;
 *      color: [number, number, number];
 *      opacity: number;
 *      speedFactor: number;
 *      dropRate: number;
 *      dropRateBump: number;
 *      fadeOpacity: number;
 *      retina: boolean;
 *      minZoom: number;
 *      maxZoom: number;
 * }} ParticlesConfig
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {ParticlesConfig} config
 */
export function particlesGl(gl, config) {
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
        console.log('OES_texture_float WebGL extension is required');
        return;
    }

    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    const stepProgram = createStepProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const copyProgram = createCopyProgram(gl);

    const quadBuffer = createQuadBuffer(gl);

    let initialized = false;

    /** @type number */
    let pixelRatio;

    /** @type WebGLTextureWrapper */
    let sourceTexture;

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

    function update() {
        if (!(config.image && config.count > 0)) {
            initialized = false;
            return;
        }

        if (initialized) {
            gl.deleteTexture(sourceTexture.texture);
            gl.deleteBuffer(particlesBuffer.buffer);
            gl.deleteBuffer(particlesIndexBuffer.buffer);
            gl.deleteTexture(particlesStateTexture0.texture);
            gl.deleteTexture(particlesStateTexture1.texture);
            gl.deleteTexture(particlesScreenTexture0.texture);
            gl.deleteTexture(particlesScreenTexture1.texture);

            initialized = false;
        }

        pixelRatio = getPixelRatio(config.retina);

        sourceTexture = createImageTexture(gl, config.image);

        particlesBuffer = createParticlesBuffer(gl, config.count);
        particlesIndexBuffer = createParticlesIndexBuffer(gl, config.count);

        const particlesStateResolution = Math.ceil(Math.sqrt(config.count));
        const particlesState = new Float32Array(particlesStateResolution * particlesStateResolution * 4);
        particlesStateTexture0 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);
        particlesStateTexture1 = createArrayTexture(gl, particlesState, particlesStateResolution, particlesStateResolution);

        const emptyTexture = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
        particlesScreenTexture0 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);
        particlesScreenTexture1 = createArrayTexture(gl, emptyTexture, gl.canvas.width, gl.canvas.height);

        initialized = true;
    }
    update();

    /**
     * @param {number[]} matrix
     * @param {number} zoom
     * @param {[[number, number], [number, number]]} worldBounds
     * @param {number[]} worldOffsets
     */
    function prerender(matrix, zoom, worldBounds, worldOffsets) {
        if (!initialized) {
            return;
        }

        const speedFactor = config.speedFactor * pixelRatio / 1.8 ** zoom;
        const particleSize = config.size * pixelRatio;
        const particleColor = /** @type [number, number, number, number] */ ([config.color[0] / 255, config.color[1] / 255, config.color[2] / 255, config.opacity]);

        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (blendEnabled) {
            gl.disable(gl.BLEND);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // draw to particles state texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        computeStep(gl, stepProgram, quadBuffer, particlesStateTexture0, sourceTexture, config.bounds, speedFactor, config.dropRate, config.dropRateBump, worldBounds);

        // const particlesStateResolution = Math.ceil(Math.sqrt(config.count));
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
        if (!initialized) {
            return;
        }
        
        const blendEnabled = gl.isEnabled(gl.BLEND);
        if (!blendEnabled) {
            gl.enable(gl.BLEND);
        }

        // draw to canvas
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1);

        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }

    function destroy() {
        stop();

        gl.deleteFramebuffer(framebuffer);

        gl.deleteProgram(stepProgram.program);
        gl.deleteProgram(fadeProgram.program);
        gl.deleteProgram(particlesProgram.program);
        gl.deleteProgram(copyProgram.program);

        gl.deleteBuffer(quadBuffer.buffer);

        gl.deleteTexture(sourceTexture.texture);

        gl.deleteBuffer(particlesBuffer.buffer);
        gl.deleteBuffer(particlesIndexBuffer.buffer);
        gl.deleteTexture(particlesStateTexture0.texture);
        gl.deleteTexture(particlesStateTexture1.texture);
        gl.deleteTexture(particlesScreenTexture0.texture);
        gl.deleteTexture(particlesScreenTexture1.texture);
    }

    return {
        config,
        update,
        prerender,
        render,
        destroy,
    };
}
