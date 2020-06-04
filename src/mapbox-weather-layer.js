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

        this.config = config;
        this.running = true;
    }
 
    /**
     * @param {mapboxgl.Map} map
     * @param {WebGLRenderingContext} gl
     */
    async onAdd(map, gl) {
        this.map = map;
        this.weather = await drawToGl(gl, { ...this.config, particleOpacity: 0.333, overlayOpacity: 0.1 });

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

        if (this.running) {
            const offsets = this.getWorldOffsets();
            this.weather.prerender(new Float32Array(matrix), offsets);
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

        const offsets = this.getWorldOffsets();
        this.weather.render(new Float32Array(matrix), offsets);

        if (this.running) {
            this.map.triggerRepaint();
        }
    }

    /**
     * @return {number[]}
     */
    getWorldOffsets() {
        const worldOffsets = this.map.transform.getVisibleUnwrappedCoordinates({z: 0, x: 0, y: 0}).map(x => x.wrap).sort((a, b) => a - b);
        return worldOffsets.slice(1, worldOffsets.length - 1);
    }
}