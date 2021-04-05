import rgba from 'color-rgba';

/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {Uint8Array}
 */
export function colorRampArray(colorFunction, count = 256) {
    const colors = new Uint8Array(count * 4);
    for (let i = 0; i < count; i++) {
        const color = rgba(colorFunction(i / (count - 1))) || [255, 255, 255];
        colors[i * 4] = color[0];
        colors[i * 4 + 1] = color[1];
        colors[i * 4 + 2] = color[2];
        colors[i * 4 + 3] = 255;
    }
    
    return colors;
}

/**
 * @param {(i: number) => (string | [number, number, number])} colorFunction
 * @param {number} count
 * @return {HTMLCanvasElement}
 */
export function colorRampCanvas(colorFunction, count = 256) {
    const colors = colorRampArray(colorFunction, count);

    const canvas = /** @type HTMLCanvasElement */ (document.createElement('canvas'));
    canvas.width = count;
    canvas.height = 1;
    canvas.style.imageRendering = '-moz-crisp-edges';
    canvas.style.imageRendering = 'pixelated';
    
    const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));

    for (let i = 0; i < count; i++) {
        const color = colors.slice(i * 4, i * 4 + 4);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
        ctx.fillRect(i, 0, 1, canvas.height);
    }
    
    return canvas;
}