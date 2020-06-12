import { colorRamp } from './color-ramp.js';

/** @typedef {import('./gl.js').MaritraceMapboxWeatherConfig} MaritraceMapboxWeatherConfig */
    
export class WeatherLegendControl {
    /**
     * @param {MaritraceMapboxWeatherConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    onAdd() {
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl';
        this.container.style.background = 'rgba(255, 255, 255, 0.5)';
        this.container.style.backdropFilter = 'blur(1px)';
        this.container.style.fontSize = '10px';
        this.container.style.color = '#333';

        this.render();

        return this.container;
    }

    onRemove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = undefined;
        }
    }

    render() {
        if (!this.container) {
            return;
        }

        this.container.innerHTML = '';

        const xmlns = 'http://www.w3.org/2000/svg';
        const paddingY = 15;
        const svg = /** @type SVGElement */ (document.createElementNS(xmlns, 'svg'));
        svg.setAttribute('width', `${this.config.overlay.legendWidth + 2 * paddingY}px`);
        svg.setAttribute('height', '50px');
        svg.style.display = 'block';
        this.container.appendChild(svg);

        const title = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
        title.innerHTML = this.config.overlay.legendTitle;
        title.style.fontWeight = 'bold';
        title.style.transform = `translate(${paddingY}px, 15px)`;
        svg.appendChild(title);

        const scale = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
        scale.style.transform = `translate(${paddingY}px, 22px)`;
        svg.appendChild(scale);

        const imageCanvas = this.renderScale();
        const image = /** @type SVGImageElement */ (document.createElementNS(xmlns, 'image'));
        image.setAttribute('href', imageCanvas.toDataURL());
        image.setAttribute('width', `${imageCanvas.width}`);
        image.setAttribute('height', `${imageCanvas.height}`);
        scale.appendChild(image);

        const ticks = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
        ticks.style.textAnchor = 'middle';
        scale.appendChild(ticks);

        const delta = (this.config.overlay.bounds[1] - this.config.overlay.bounds[0]) / (this.config.overlay.legendTicksCount - 1);
        for (let i = 0; i < this.config.overlay.legendTicksCount; i++) {
            const x = this.config.overlay.bounds[0] + i * delta;

            const tick = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
            tick.style.transform = `translate(${(x - this.config.overlay.bounds[0]) / (this.config.overlay.bounds[1] - this.config.overlay.bounds[0]) * this.config.overlay.legendWidth}px, 0)`;
            ticks.appendChild(tick);

            const line = /** @type SVGLineElement */ (document.createElementNS(xmlns, 'line'));
            line.setAttribute('y1', '0');
            line.setAttribute('y2', '10');
            line.style.stroke = 'currentColor';
            tick.appendChild(line);

            const value = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
            value.innerHTML = `${x}`;
            value.style.transform = 'translate(0, 22px)';
            tick.appendChild(value);
        }
    }

    renderScale() {
        const canvas = /** @type HTMLCanvasElement */ (document.createElement('canvas'));
        canvas.width = this.config.overlay.legendWidth;
        canvas.height = 5;
        canvas.style.display = 'block';
        canvas.style.border = '1px solid #eee';
        canvas.style.imageRendering = '-moz-crisp-edges';
        canvas.style.imageRendering = 'pixelated';
        const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
        const colors = colorRamp(this.config.overlay.colorFunction, this.config.overlay.legendWidth);
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(i, 0, 1, canvas.height);
        }
        return canvas;
    }
}