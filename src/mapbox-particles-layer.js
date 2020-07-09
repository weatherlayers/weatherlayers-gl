import { particlesGl } from './particles-gl.js';
import { getMercatorBounds } from './get-mercator-bounds.js';
import { getGeographicPosition } from './get-geographic-position.js';

/** @typedef {import('mapbox-gl')} mapboxgl */
/** @typedef {import('./particles-gl.js').ParticlesConfig} ParticlesConfig */

export class ParticlesLayer {
    id = 'weather-particles';
    type = 'custom';
    renderingMode = '2d';

    lastFrameTime = 0;
    running = false;

    mapMoving = false;

    onMoveStartBound = this.onMoveStart.bind(this);
    onResizeBound = this.onResize.bind(this);
    onMoveEndBound = this.onMoveEnd.bind(this);

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

        this.map.on('movestart', this.onMoveStartBound);
        this.map.on('moveend', this.onMoveEndBound);
        this.map.on('resize', this.onResizeBound);
        this.start();
    }

    onRemove() {
        if (!this.map || !this.canvas || !this.gl || !this.renderer) {
            return;
        }

        this.map.off('movestart', this.onMoveStartBound);
        this.map.off('moveend', this.onMoveEndBound);
        this.map.off('resize', this.onResizeBound);
        this.canvas.remove();
        this.renderer.destroy();

        this.map = undefined;
        this.canvas = undefined;
        this.gl = undefined;
        this.renderer = undefined;
    }

    onMoveStart() {
        this.mapMoving = true;

        if (this.renderer) {
            this.renderer.clear();
        }
    }

    onMoveEnd() {
        this.mapMoving = false;
    }

    onResize() {
        this.update();
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
        this.frame();
    }

    frame() {
        if (!this.map || !this.canvas || !this.gl || !this.renderer) {
            return;
        }

        const fps = 30;
        const fpsInterval = 1000 / fps;
        const now = Date.now();
        const elapsed = now - this.lastFrameTime;

        if (elapsed > fpsInterval) {
            this.lastFrameTime = now - (elapsed % fpsInterval);
            
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            if (this.enabled && !this.mapMoving) {
                const matrix = this.map.transform.customLayerMatrix();
                const bounds = getMercatorBounds(this.map.getBounds());
                const zoom = this.map.getZoom();

                this.renderer.prerender(matrix, bounds, zoom);
                this.renderer.render();
            }
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

        const geographicPosition = getGeographicPosition(lngLat);
        const vector = this.renderer.getPositionVector(geographicPosition);

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

        const geographicPosition = getGeographicPosition(lngLat);
        const bearing = this.renderer.getPositionBearing(geographicPosition);

        return bearing;
    }
}