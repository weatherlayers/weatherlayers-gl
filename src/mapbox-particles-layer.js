import { particlesGl } from './particles-gl.js';
import { getEquirectangularPosition } from './get-equirectangular-position.js';
import { getWorldBounds } from './get-world-bounds.js';
import { getWorldOffsets } from './get-world-offsets.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./particles-gl.js').ParticlesConfig} ParticlesConfig */

export class ParticlesLayer {
    /**
     * @param {ParticlesConfig} config
     */
    constructor(config) {
        this.id = 'weather-particles';
        this.type = 'custom';
        this.renderingMode = '2d';

        config.minZoom = config.minZoom || 0;
        config.maxZoom = config.maxZoom || 14;
        this.config = config;

        this.running = true;
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

        // this.i = (this.i || 0) + 1;
        // if (this.i > 1) {
        //     this.i = 0;
        //     this.running = false;
        //     return;
        // }

        if (this.enabled && this.running) {
            const zoom = this.map.getZoom();
            const worldBounds = getWorldBounds(this.map);
            const worldOffsets = getWorldOffsets(this.map);
            this.renderer.prerender(matrix, zoom, worldBounds, worldOffsets);
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

        if (this.enabled && this.running) {
            const worldOffsets = getWorldOffsets(this.map);
            this.renderer.render(matrix, worldOffsets);

            this.map.triggerRepaint();
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
        const enabled = this.config.image && this.config.count > 0 && this.config.minZoom <= zoom && zoom <= this.config.maxZoom;

        return enabled;
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {[number, number] | undefined}
     */
    getPositionValues(lngLat) {
        if (!this.map || !this.renderer) {
            return;
        }

        const position = getEquirectangularPosition(lngLat);
        const values = this.renderer.getPositionValues(position);

        return values;
    }

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {number | undefined}
     */
    getPositionBearing(lngLat) {
        if (!this.map || !this.renderer) {
            return;
        }

        const values = this.getPositionValues(lngLat);
        if (!values) {
            return;
        }

        const bearing = (Math.atan2(values[0], values[1]) * 180 / Math.PI + 360) % 360;

        return bearing;
    }
}