const MAX_LATITUDE = 90;
const MAX_MERCATOR_LATITUDE = 85.06;
    
/**
 * @param {ImageBitmap} image
 * @returns {Promise<ImageBitmap>}
 */
export function clipImageMercator(image) {
    const resolution = MAX_LATITUDE * 2 / image.height;
    const top = (MAX_LATITUDE - MAX_MERCATOR_LATITUDE) / resolution;

    const canvas = /** @type HTMLCanvasElement */ (document.createElement('canvas'));
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext('2d'));
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    for (let i = 0; i < top; i++) {
        for (let j = 0; j < image.width; j++) {
            const index = i * image.width + j;
            imageData.data[index * 4 + 3] = 0;
        }
    }
    for (let i = image.height - 1; i > image.height - top - 1; i--) {
        for (let j = 0; j < image.width; j++) {
            const index = i * image.width + j;
            imageData.data[index * 4 + 3] = 0;
        }
    }

    return createImageBitmap(imageData);
}