import { createTexture } from './webgl-common.js';
import { createQuadBuffer } from './shaders/quad.js';
import { createUpdateProgram, runUpdate } from './shaders/update.js';
import { createFadeProgram, drawFade } from './shaders/fade.js';
import { createParticlesBuffer, createParticlesProgram, drawParticles } from './shaders/particles.js';
import { createCopyProgram, drawCopy } from './shaders/copy.js';
import { getPositionValues } from './get-position-values.js';
import { hasValues } from './has-values.js';

/** @typedef {import('./webgl-common.js').WebGLProgramWrapper} WebGLProgramWrapper */
/** @typedef {import('./webgl-common.js').WebGLBufferWrapper} WebGLBufferWrapper */
/** @typedef {import('./webgl-common.js').WebGLTextureWrapper} WebGLTextureWrapper */
/**
 * @typedef {{
 *      image: { data: Float32Array, width: number, height: number, numDimensions: number };
 *      bounds: [number, number];
 *      count: number;
 *      size: number;
 *      color: [number, number, number];
 *      opacity: number;
 *      speedFactor: number;
 *      maxAge: number;
 *      waves?: boolean;
 *      minZoom?: number;
 *      maxZoom?: number;
 * }} ParticlesConfig
 */

/**
 * @param {WebGLRenderingContext} gl
 * @param {ParticlesConfig} config
 */
export function particlesGl(gl, config) {
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');

    const updateProgram = createUpdateProgram(gl);
    const fadeProgram = createFadeProgram(gl);
    const particlesProgram = createParticlesProgram(gl);
    const copyProgram = createCopyProgram(gl);

    const quadBuffer = createQuadBuffer(gl);

    const framebuffer = /** @type WebGLFramebuffer */ (gl.createFramebuffer());

    let initialized = false;

    /** @type number */
    let frameNumber;

    /** @type number */
    let pixelRatio;

    /** @type WebGLTextureWrapper */
    let sourceTexture;

    /** @type WebGLBufferWrapper */
    let particlesBuffer;

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

    function clear() {
        if (initialized) {
            gl.deleteTexture(particlesStateTexture0.texture);
            gl.deleteTexture(particlesStateTexture1.texture);
            gl.deleteTexture(particlesScreenTexture0.texture);
            gl.deleteTexture(particlesScreenTexture1.texture);
        }

        const particlesStateResolution = Math.ceil(Math.sqrt(config.count));
        const particlesState = new Float32Array(particlesStateResolution * particlesStateResolution * 4);
        particlesStateTexture0 = createTexture(gl, gl.RGBA, gl.FLOAT, gl.NEAREST, particlesState, particlesStateResolution, particlesStateResolution);
        particlesStateTexture1 = createTexture(gl, gl.RGBA, gl.FLOAT, gl.NEAREST, particlesState, particlesStateResolution, particlesStateResolution);

        const emptyTexture = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
        particlesScreenTexture0 = createTexture(gl, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, emptyTexture, gl.canvas.width, gl.canvas.height);
        particlesScreenTexture1 = createTexture(gl, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, emptyTexture, gl.canvas.width, gl.canvas.height);
    }
    function update() {
        if (!(config.image && config.count > 0)) {
            initialized = false;
            return;
        }

        if (initialized) {
            gl.deleteTexture(sourceTexture.texture);
            gl.deleteBuffer(particlesBuffer.buffer);
            gl.deleteTexture(particlesStateTexture0.texture);
            gl.deleteTexture(particlesStateTexture1.texture);
            gl.deleteTexture(particlesScreenTexture0.texture);
            gl.deleteTexture(particlesScreenTexture1.texture);

            initialized = false;
        }

        frameNumber = 0;

        pixelRatio = window.devicePixelRatio || 1;

        sourceTexture = createTexture(gl, gl.LUMINANCE_ALPHA, gl.FLOAT, gl.LINEAR, config.image.data, config.image.width, config.image.height);

        particlesBuffer = createParticlesBuffer(gl, config.count);

        clear();

        initialized = true;
    }
    update();

    /**
     * @param {number[]} matrix
     * @param {[[number, number], [number, number]]} worldBounds
     * @param {number} zoom
     */
    function prerender(matrix, worldBounds, zoom) {
        if (!initialized) {
            return;
        }

        const particleSize = config.size * pixelRatio;
        const particleColor = /** @type [number, number, number, number] */ ([config.color[0] / 255, config.color[1] / 255, config.color[2] / 255, 1]);
        const speedFactor = config.speedFactor * pixelRatio / 2 ** zoom;
        const fadeMaxAge = config.waves ? 1 : config.maxAge;

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // draw to particles state texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesStateTexture1.texture, 0);
        gl.viewport(0, 0, particlesStateTexture0.x, particlesStateTexture0.y);
        gl.clear(gl.COLOR_BUFFER_BIT);
        runUpdate(gl, updateProgram, quadBuffer, particlesStateTexture0, sourceTexture, worldBounds, speedFactor, config.maxAge, frameNumber);
        frameNumber = (frameNumber + 1) % (config.maxAge + 2); // +2 because only non-randomized pairs are rendered

        // const particlesStateResolution = Math.ceil(Math.sqrt(config.count));
        // const state = new Float32Array(particlesStateResolution * particlesStateResolution * 4);
        // gl.readPixels(0, 0, particlesStateResolution, particlesStateResolution, gl.RGBA, gl.FLOAT, state);
        // const positions = new Array(particlesStateResolution * particlesStateResolution).fill(undefined).map((_, i) => {
        //     return [
        //         state[i * 4],
        //         state[i * 4 + 1]
        //     ];
        // }).flat();
        // console.log(positions);

        // draw to particles screen texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particlesScreenTexture1.texture, 0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawFade(gl, fadeProgram, quadBuffer, particlesScreenTexture0, fadeMaxAge);
        drawParticles(gl, particlesProgram, particlesBuffer, particlesStateTexture0, particlesStateTexture1, particleSize, particleColor, !!config.waves, matrix, worldBounds);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // swap particle state and screen textures
        [particlesStateTexture1, particlesStateTexture0] = [particlesStateTexture0, particlesStateTexture1];
        [particlesScreenTexture1, particlesScreenTexture0] = [particlesScreenTexture0, particlesScreenTexture1];
    }

    function render() {
        if (!initialized) {
            return;
        }
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // draw to canvas
        drawCopy(gl, copyProgram, quadBuffer, particlesScreenTexture1, config.opacity);

        gl.disable(gl.BLEND);
    }

    function destroy() {
        stop();

        gl.deleteProgram(updateProgram.program);
        gl.deleteProgram(fadeProgram.program);
        gl.deleteProgram(particlesProgram.program);
        gl.deleteProgram(copyProgram.program);

        gl.deleteBuffer(quadBuffer.buffer);

        gl.deleteFramebuffer(framebuffer);

        gl.deleteTexture(sourceTexture.texture);

        gl.deleteBuffer(particlesBuffer.buffer);
        gl.deleteTexture(particlesStateTexture0.texture);
        gl.deleteTexture(particlesStateTexture1.texture);
        gl.deleteTexture(particlesScreenTexture0.texture);
        gl.deleteTexture(particlesScreenTexture1.texture);
    }

    /**
     * @param {[number, number]} position
     * @return {[number, number] | undefined}
     */
    function getPositionVector(position) {
        if (!config.image) {
            return;
        }

        const values = getPositionValues(config.image, position);
        if (!hasValues(values)) {
            return;
        }

        /** @type [number, number] */
        const vector = [
            values[0],
            values[1],
        ];

        return vector;
    }

    /**
     * @param {[number, number]} position
     * @return {number | undefined}
     */
    function getPositionBearing(position) {
        if (!config.image) {
            return;
        }

        const vector = getPositionVector(position);
        if (!vector) {
            return;
        }

        const bearing = ((360 - (Math.atan2(vector[1], vector[0]) / Math.PI * 180) - 90) + 360) % 360;

        return bearing;
    }

    return {
        config,
        clear,
        update,
        prerender,
        render,
        destroy,
        getPositionVector,
        getPositionBearing,
    };
}
