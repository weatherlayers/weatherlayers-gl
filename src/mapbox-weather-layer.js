import { drawToGl } from './gl.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./gl.js').MaritraceMapboxWeatherConfig} MaritraceMapboxWeatherConfig */

export class WeatherLayer {
    /**
     * @param {MaritraceMapboxWeatherConfig} config
     */
    constructor(config) {
        this.id = 'weather';
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
        const weather = drawToGl(gl, this.config);
        if (!weather) {
            return;
        }

        this.map = map;
        this.weather = weather;

        this.map.on('move', this.weather.resize);
        this.map.on('zoom', this.weather.resize);
        this.map.on('resize', this.weather.resize);
    }

    onRemove() {
        if (!this.map || !this.weather) {
            return;
        }

        this.map.off('move', this.weather.resize);
        this.map.off('zoom', this.weather.resize);
        this.map.off('resize', this.weather.resize);
        this.weather.destroy();
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number[]} matrix
     */
    prerender(gl, matrix) {
        if (!this.map || !this.weather) {
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
            const worldBounds = this.getWorldBounds();
            const worldOffsets = this.getWorldOffsets();
            this.weather.prerender(matrix, zoom, worldBounds, worldOffsets);
        }
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number[]} matrix
     */
    render(gl, matrix) {
        if (!this.map || !this.weather) {
            return;
        }

        const worldOffsets = this.getWorldOffsets();
        this.weather.render(matrix, worldOffsets);

        if (this.enabled && this.running && this.config.particles.count > 0) {
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
        const enabled = this.config.minZoom <= zoom && zoom <= this.config.maxZoom;
        return enabled;
    }

    /**
     * @return {[[number, number], [number, number]]}
     */
    getWorldBounds() {
        if (!this.map) {
            return [[0, 0], [1, 1]];
        }

        const bounds = this.map.getBounds();
        const topLeft = bounds.getNorthWest();
        const bottomRight = bounds.getSouthEast();
        /** @type [[number, number], [number, number]] */
        const worldBounds = [
            [
                (topLeft.lng + 180) / 360,
                1 - (topLeft.lat + 90) / 180,
            ],
            [
                (bottomRight.lng + 180) / 360,
                1 - (bottomRight.lat + 90) / 180,
            ],
        ];
        return worldBounds;
    }

    /**
     * @return {number[]}
     */
    getWorldOffsets() {
        if (!this.map) {
            return [0];
        }

        const worldOffsets = this.map.transform.getVisibleUnwrappedCoordinates({z: 0, x: 0, y: 0}).map(x => x.wrap).sort((a, b) => a - b);
        return worldOffsets.slice(1, worldOffsets.length - 1);
    }
}