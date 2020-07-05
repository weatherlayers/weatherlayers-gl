import { particlesGl } from './particles-gl.js';
import { getGeographicPosition } from './get-geographic-position.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./particles-gl.js').ParticlesConfig} ParticlesConfig */

export class ParticlesLayer {
    id = 'weather-particles';
    type = 'custom';
    renderingMode = '2d';

    running = false;

    updateBound = this.update.bind(this);

    /**
     * @param {ParticlesConfig} config
     */
    constructor(config) {
        config.maxZoom = config.maxZoom || 14;
        this.config = config;
    }
 
    /**
     * @param {mapboxgl.Map} map
     */
    onAdd(map) {
        const mapCanvas = map.getCanvas();
        const canvas = document.createElement('canvas');
        canvas.width = mapCanvas.width;
        canvas.height = mapCanvas.height;
        canvas.style.width = mapCanvas.style.width;
        canvas.style.height = mapCanvas.style.height;
        canvas.style.position = 'absolute';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.pointerEvents = 'none';
        /** @type HTMLElement */ (map.getCanvasContainer().parentElement).appendChild(canvas);
        const gl = /** @type WebGLRenderingContext */ (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true }));

        const renderer = particlesGl(gl, this.config);
        if (!renderer) {
            return;
        }

        this.map = map;
        this.canvas = canvas;
        this.gl = gl;
        this.renderer = renderer;

        this.map.on('move', this.updateBound);
        this.map.on('zoom', this.updateBound);
        this.map.on('resize', this.updateBound);
        this.start();
    }

    onRemove() {
        if (!this.map || !this.canvas || !this.gl || !this.renderer) {
            return;
        }

        this.map.off('move', this.updateBound);
        this.map.off('zoom', this.updateBound);
        this.map.off('resize', this.updateBound);
        this.canvas.remove();
        this.renderer.destroy();

        this.map = undefined;
        this.canvas = undefined;
        this.gl = undefined;
        this.renderer = undefined;
    }

    update() {
        if (!this.map || !this.canvas || !this.gl || !this.renderer) {
            return;
        }
        
        const mapCanvas = this.map.getCanvas();
        this.canvas.width = mapCanvas.width;
        this.canvas.height = mapCanvas.height;
        this.canvas.style.width = mapCanvas.style.width;
        this.canvas.style.height = mapCanvas.style.height;
        this.renderer.update();
    }

    frame() {
        if (!this.map || !this.canvas || !this.gl || !this.renderer) {
            return;
        }

        if (this.enabled) {
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            const matrix = this.map.transform.customLayerMatrix();
            const worldBounds = [this.map.getBounds().getNorthWest(), this.map.getBounds().getSouthEast()]
            /** @type [[number, number], [number, number]] */
            const geographicWorldBounds = [getGeographicPosition(worldBounds[0]), getGeographicPosition(worldBounds[1])];
            const zoom = this.map.getZoom();

            this.renderer.prerender(matrix, geographicWorldBounds, zoom);
            this.renderer.render();
        }

        if (this.running) {
            this.raf = requestAnimationFrame(() => this.frame());
        }
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.frame();
    }

    stop() {
        if (!this.running) {
            return;
        }

        this.running = false;
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }

    step() {
        if (!this.running) {
            this.frame();
        }
    }

    render() {
        // noop
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