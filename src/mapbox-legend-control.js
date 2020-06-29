import { colorRampCanvas } from './color-ramp.js';

/** @typedef {import('./overlay-gl.js').OverlayConfig} OverlayConfig */
    
export class LegendControl {
    /**
     * @param {OverlayConfig} config
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

        this.update();

        return this.container;
    }

    onRemove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = undefined;
        }
    }

    update() {
        if (!this.container) {
            return;
        }

        this.container.innerHTML = '';

        const xmlns = 'http://www.w3.org/2000/svg';
        const paddingY = 15;
        const svg = /** @type SVGElement */ (document.createElementNS(xmlns, 'svg'));
        svg.setAttribute('width', `${this.config.legendWidth + 2 * paddingY}px`);
        svg.setAttribute('height', '50px');
        svg.style.display = 'block';
        this.container.appendChild(svg);

        const title = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
        title.innerHTML = this.config.legendTitle;
        title.style.fontWeight = 'bold';
        title.style.transform = `translate(${paddingY}px, 15px)`;
        svg.appendChild(title);

        const scale = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
        scale.style.transform = `translate(${paddingY}px, 22px)`;
        svg.appendChild(scale);

        const imageCanvas = colorRampCanvas(this.config.colorFunction, this.config.legendWidth);
        const image = /** @type SVGImageElement */ (document.createElementNS(xmlns, 'image'));
        image.setAttribute('href', imageCanvas.toDataURL());
        image.setAttribute('width', `${this.config.legendWidth}`);
        image.setAttribute('height', '5');
        image.setAttribute('preserveAspectRatio', 'none');
        scale.appendChild(image);

        const ticks = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
        ticks.style.textAnchor = 'middle';
        scale.appendChild(ticks);

        const delta = (this.config.bounds[1] - this.config.bounds[0]) / (this.config.legendTicksCount - 1);
        const roundTicks = Math.round(this.config.bounds[1]) === this.config.bounds[1];
        for (let i = 0; i < this.config.legendTicksCount; i++) {
            const x = this.config.bounds[0] + i * delta;

            const tick = /** @type SVGGElement */ (document.createElementNS(xmlns, 'g'));
            tick.style.transform = `translate(${(x - this.config.bounds[0]) / (this.config.bounds[1] - this.config.bounds[0]) * this.config.legendWidth}px, 0)`;
            ticks.appendChild(tick);

            const line = /** @type SVGLineElement */ (document.createElementNS(xmlns, 'line'));
            line.setAttribute('y1', '0');
            line.setAttribute('y2', '10');
            line.style.stroke = 'currentColor';
            tick.appendChild(line);

            const value = /** @type SVGTextElement */ (document.createElementNS(xmlns, 'text'));
            value.innerHTML = `${roundTicks ? Math.round(x) : Math.round(x * 10) / 10}`;
            value.style.transform = 'translate(0, 22px)';
            tick.appendChild(value);
        }
    }
}