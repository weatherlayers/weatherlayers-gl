import { overlayGl } from './overlay-gl.js';
import { getGeographicPosition } from './get-geographic-position.js';
import { getMercatorPosition } from './get-mercator-position.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./overlay-gl.js').OverlayConfig} OverlayConfig */

export class OverlayLayer {
    id = 'weather-overlay';
    type = 'custom';
    renderingMode = '2d';

    updateBound = this.update.bind(this);

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

        this.map.on('move', this.updateBound);
        this.map.on('zoom', this.updateBound);
        this.map.on('resize', this.updateBound);
    }

    onRemove() {
        if (!this.map || !this.renderer) {
            return;
        }

        this.map.off('move', this.updateBound);
        this.map.off('zoom', this.updateBound);
        this.map.off('resize', this.updateBound);
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
            const worldBounds = [this.map.getBounds().getNorthWest(), this.map.getBounds().getSouthEast()];
            /** @type [[number, number], [number, number]] */
            const mercatorWorldBounds = [getMercatorPosition(worldBounds[0]), getMercatorPosition(worldBounds[1])];
            this.renderer.render(matrix, mercatorWorldBounds);
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

        const geographicPosition = getGeographicPosition(lngLat);
        const value = this.renderer.getPositionValue(geographicPosition);

        return value;
    }
}