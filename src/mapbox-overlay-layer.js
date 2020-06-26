import { overlayGl } from './overlay-gl.js';
import { getGeographicPosition } from './get-geographic-position.js';

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
            const worldBounds = [this.map.getBounds().getNorthWest(), this.map.getBounds().getSouthEast()]
            /** @type [[number, number], [number, number]] */
            const geographicWorldBounds = [getGeographicPosition(worldBounds[0]), getGeographicPosition(worldBounds[1])];
            this.renderer.render(matrix, geographicWorldBounds);
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

        const position = getGeographicPosition(lngLat);
        const value = this.renderer.getPositionValue(position);

        return value;
    }
}