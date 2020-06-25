import { particlesGl } from './particles-gl.js';
import { getGeographicPosition } from './get-geographic-position.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./particles-gl.js').ParticlesConfig} ParticlesConfig */

export class ParticlesLayer {
    id = 'weather-particles';
    type = 'custom';
    renderingMode = '2d';

    _running = true;

    /**
     * @param {ParticlesConfig} config
     */
    constructor(config) {
        config.minZoom = config.minZoom || 0;
        config.maxZoom = config.maxZoom || 14;
        this.config = config;
    }
 
    /**
     * @param {mapboxgl.Map} map
     * @param {WebGLRenderingContext} gl
     */
    onAdd(map, gl) {
        const renderer = particlesGl(gl, this.config);
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
    prerender(gl, matrix) {
        if (!this.map || !this.renderer) {
            return;
        }

        if (this.enabled) {
            const worldBounds = [this.map.getBounds().getNorthWest(), this.map.getBounds().getSouthEast()]
            /** @type [[number, number], [number, number]] */
            const geographicWorldBounds = [getGeographicPosition(worldBounds[0]), getGeographicPosition(worldBounds[1])];
            const zoom = this.map.getZoom();
            this.renderer.prerender(matrix, geographicWorldBounds, zoom);
        }
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
            this.renderer.render();

            if (this._running) {
                this.map.triggerRepaint();
            }
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
            this.config.count > 0 &&
            (typeof this.config.minZoom !== 'undefined' ? this.config.minZoom <= zoom : true) &&
            (typeof this.config.maxZoom !== 'undefined' ? zoom <= this.config.maxZoom : true)
        );

        return enabled;
    }

    /**
     * @return {boolean}
     */
    get running() {
        return this._running;
    }

    /**
     * @param {boolean} value
     */
    set running(value) {
        this._running = value;

        if (this.map && this._running) {
            this.map.triggerRepaint();
        }
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {[number, number] | undefined}
     */
    getPositionVector(lngLat) {
        if (!this.map || !this.renderer) {
            return;
        }

        const position = getGeographicPosition(lngLat);
        const vector = this.renderer.getPositionVector(position);

        return vector;
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {number | undefined}
     */
    getPositionBearing(lngLat) {
        if (!this.map || !this.renderer) {
            return;
        }

        const position = getGeographicPosition(lngLat);
        const bearing = this.renderer.getPositionBearing(position);

        return bearing;
    }
}