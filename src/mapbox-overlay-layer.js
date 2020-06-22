import { overlayGl } from './overlay-gl.js';
import { texture2DBilinear } from './texture-2d-bilinear.js';
import { getEquirectangularPosition } from './get-equirectangular-position.js';
import { getWorldOffsets } from './get-world-offsets.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./overlay-gl.js').OverlayConfig} OverlayConfig */

export class OverlayLayer {
    /**
     * @param {OverlayConfig} config
     */
    constructor(config) {
        this.id = 'weather-overlay';
        this.type = 'custom';
        this.renderingMode = '2d';

        config.minZoom = config.minZoom || 0;
        config.maxZoom = config.maxZoom || 14;
        this.config = config;
    }
 
    /**
     * @param {mapboxgl.Map} map
     * @param {WebGLRenderingContext} gl
     */
    onAdd(map, gl) {
        const renderer = overlayGl(gl, this.config);
        if (!renderer) {
            return;
        }

        this.map = map;
        this.renderer = renderer;

        this.map.on('move', this.renderer.update);
        this.map.on('zoom', this.renderer.update);
        this.map.on('resize', this.renderer.update);
    }

    onRemove() {
        if (!this.map || !this.renderer) {
            return;
        }

        this.map.off('move', this.renderer.update);
        this.map.off('zoom', this.renderer.update);
        this.map.off('resize', this.renderer.update);
        this.renderer.destroy();
    }

    update() {
        if (!this.map || !this.renderer) {
            return;
        }
        
        this.renderer.update();
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number[]} matrix
     */
    render(gl, matrix) {
        if (!this.map || !this.renderer) {
            return;
        }

        if (this.enabled) {
            const worldOffsets = getWorldOffsets(this.map);
            this.renderer.render(matrix, worldOffsets);
        }
    }

    /**
     * @return {boolean}
     */
    get enabled() {
        if (!this.map) {
            return false;
        }

        const zoom = this.map.getZoom();
        const enabled = this.config.image && this.config.minZoom <= zoom && zoom <= this.config.maxZoom;

        return enabled;
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {number}
     */
    getPositionValue(lngLat) {
        const position = getEquirectangularPosition(lngLat);

        const canvas = /** @type HTMLCanvasElement */ (document.createElement("canvas"));
        canvas.width = this.config.image.width;
        canvas.height = this.config.image.height;

        const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
        ctx.drawImage(this.config.image, 0, 0);

        const color = texture2DBilinear(ctx, position);

        const value = color[0] / 255 * (this.config.bounds[1] - this.config.bounds[0]) + this.config.bounds[0];

        return value;
    }
}