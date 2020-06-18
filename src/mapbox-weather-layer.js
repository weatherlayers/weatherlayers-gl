import { drawToGl } from './gl.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./gl.js').MaritraceMapboxWeatherConfig} MaritraceMapboxWeatherConfig */

/**
 * equirectangular
 * @param {mapboxgl.LngLat} lngLat
 * @return {[number, number]}
 */
function getPosition(lngLat) {
    return [
        (lngLat.lng + 180) / 360,
        1 - (lngLat.lat + 90) / 180,
    ];
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
function mix(x, y, a) {
    return x * (1 - a) + y * a;
}

/**
 * @param {Uint8ClampedArray} x
 * @param {Uint8ClampedArray} y
 * @param {number} a
 * @return {Uint8ClampedArray}
 */
function mix4(x, y, a) {
    return new Uint8ClampedArray([
        mix(x[0], y[0], a),
        mix(x[1], y[1], a),
        mix(x[2], y[2], a),
        mix(x[3], y[3], a),
    ]);
}

/**
 * manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
 * see https://gamedev.stackexchange.com/questions/101953/low-quality-bilinear-sampling-in-webgl-opengl-directx
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} position
 * @return {Uint8ClampedArray}
 */
function texture2DBilinear(ctx, position) {
    const floorPosition = [
        Math.floor(position[0] * ctx.canvas.width),
        Math.floor(position[1] * ctx.canvas.height),
    ];
    const fractPosition = [
        (position[0] * ctx.canvas.width) % 1,
        (position[1] * ctx.canvas.height) % 1,
    ];
    const topLeft = ctx.getImageData(floorPosition[0], floorPosition[1], 1, 1).data;
    const topRight = ctx.getImageData(floorPosition[0] + 1, floorPosition[1], 1, 1).data;
    const bottomLeft = ctx.getImageData(floorPosition[0], floorPosition[1] + 1, 1, 1).data;
    const bottomRight = ctx.getImageData(floorPosition[0] + 1, floorPosition[1] + 1, 1, 1).data;
    const values = mix4(mix4(topLeft, topRight, fractPosition[0]), mix4(bottomLeft, bottomRight, fractPosition[0]), fractPosition[1]);

    return values;
}

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
            getPosition(topLeft),
            getPosition(bottomRight),
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

    /**
     * @param {mapboxgl.LngLat} lngLat
     * @return {[number, number, number]}
     */
    getPositionValues(lngLat) {
        const position = getPosition(lngLat);

        const canvas = /** @type HTMLCanvasElement */ (document.createElement("canvas"));
        canvas.width = this.config.source.image.width;
        canvas.height = this.config.source.image.height;

        const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
        ctx.drawImage(this.config.source.image, 0, 0);

        const color = texture2DBilinear(ctx, position);

        /** @type [number, number, number] */
        const values =  [
            color[0] / 255 * (this.config.overlay.bounds[1] - this.config.overlay.bounds[0]) + this.config.overlay.bounds[0],
            color[1] / 255 * (this.config.particles.bounds[1] - this.config.particles.bounds[0]) + this.config.particles.bounds[0],
            color[2] / 255 * (this.config.particles.bounds[1] - this.config.particles.bounds[0]) + this.config.particles.bounds[0],
        ];

        return values;
    }
}