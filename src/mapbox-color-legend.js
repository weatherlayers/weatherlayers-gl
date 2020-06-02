export class ColorLegend {
    /**
     * @param {[number, number, number][]} colorRamp
     */
    constructor(colorRamp) {
        this.colorRamp = colorRamp;
    }

    onAdd() {
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl';

        const canvas = this.createCanvas();
        this.container.appendChild(canvas);

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
        canvas.width = this.colorRamp.length;
        canvas.height = 5;
        canvas.style.imageRendering = '-moz-crisp-edges';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.border = '1px solid #eee';
        const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
        this.colorRamp.forEach((color, i) => {
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(i, 0, 1, canvas.height);
        });

        return canvas;
    }
}