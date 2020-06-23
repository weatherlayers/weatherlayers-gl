/**
 * @param {HTMLImageElement} image
 * @return {HTMLCanvasElement}
 */
export function createImageCanvas(image) {
    const canvas = /** @type HTMLCanvasElement */ (document.createElement("canvas"));
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
    ctx.drawImage(image, 0, 0);

    return canvas;
}