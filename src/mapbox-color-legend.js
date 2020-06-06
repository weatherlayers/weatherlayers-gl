import { colorRamp } from './color-ramp.js';

/** @typedef {import('./gl.js').MaritraceMapboxWeatherConfig} MaritraceMapboxWeatherConfig */

export class ColorLegend {
    /**
     * @param {MaritraceMapboxWeatherConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    onAdd() {
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl';

        this.canvas = this.createCanvas();
        this.container.appendChild(this.canvas);
        this.resize();

        return this.container;
    }

    onRemove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = undefined;
        }
    }

    /**
     * @return HTMLCanvasElement
     */
    createCanvas() {
        const canvas = /** @type HTMLCanvasElement */ (document.createElement('canvas'));
        canvas.width = 256;
        canvas.height = 5;
        canvas.style.imageRendering = '-moz-crisp-edges';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.border = '1px solid #eee';

        return canvas;
    }

    resize() {
        if (!this.canvas) {
            return;
        }

        const colors = colorRamp(this.config.overlay.colorFunction);

        this.canvas.width = colors.length;
        const ctx = /** @type CanvasRenderingContext2D */ (this.canvas.getContext('2d'));
        colors.forEach((color, i) => {
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(i, 0, 1, this.canvas.height);
        });
    }
}