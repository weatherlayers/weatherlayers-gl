export class ScaleControl {
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
        canvas.width = 256;
        canvas.height = 10;
        canvas.style.imageRendering = "-moz-crisp-edges";
        canvas.style.imageRendering = "pixelated";
        const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
        this.colorRamp.forEach((color, i) => {
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(i, 0, 1, 10);
        });

        return canvas;
    }
}