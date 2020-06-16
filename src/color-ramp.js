import rgba from 'color-rgba';

/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {[number, number, number, number][]}
 */
function colorRamp(colorFunction, count = 256) {
    const colors = new Array(count).fill(undefined).map((_, i) => {
        const color = rgba(colorFunction(i / (count - 1)));
        if (!color) {
            return /** @type [number, number, number, number] */ ([255, 255, 255, 255]);
        }
        return /** @type [number, number, number, number] */ ([color[0], color[1], color[2], 255]);
    });
    
    return colors;
}

/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {HTMLCanvasElement}
 */
export function colorRampCanvas(colorFunction, count = 256) {
    const colors = colorRamp(colorFunction, count);

    const canvas = /** @type HTMLCanvasElement */ (document.createElement('canvas'));
    canvas.width = colors.length;
    canvas.height = 1;
    canvas.style.imageRendering = '-moz-crisp-edges';
    canvas.style.imageRendering = 'pixelated';
    
    const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));

    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(i, 0, 1, canvas.height);
    }
    
    return canvas;
}