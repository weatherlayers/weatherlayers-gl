import { overlayGl } from './overlay-gl.js';
import { getMercatorBounds } from './get-mercator-bounds.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./overlay-gl.js').OverlayConfig} OverlayConfig */

export class OverlayLayer {
    id = 'weather-overlay';
    type = 'custom';
    renderingMode = '2d';

    /**
     * @param {OverlayConfig} config
     */
    constructor(config) {
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
    }

    onRemove() {
        if (!this.map || !this.renderer) {
            return;
        }

        this.renderer.destroy();

        this.map = undefined;
        this.renderer = undefined;
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
            const bounds = getMercatorBounds(this.map.getBounds().toArray());
            this.renderer.render(matrix, bounds);
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
        const enabled = (
            this.config.image &&
            (typeof this.config.minZoom !== 'undefined' ? this.config.minZoom <= zoom : true) &&
            (typeof this.config.maxZoom !== 'undefined' ? zoom <= this.config.maxZoom : true)
        );

        return enabled;
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {number | undefined}
     */
    getPositionValue(lngLat) {
        if (!this.map || !this.renderer) {
            return;
        }

        const value = this.renderer.getPositionValue(lngLat.toArray());

        return value;
    }
}