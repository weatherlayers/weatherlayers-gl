/**
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @return {number}
 */
 function mix(x, y, a) {
    return x * (1 - a) + y * a;
}

/**
 * @param {string} imagePath
 * @param {[number, number]} bounds
 * @param {boolean} vector
 * @return {Promise<{ data: Float32Array, width: number, height: number, numDimensions: number } | undefined>}
 */
export async function loadImage(imagePath, bounds, vector) {
    if (!imagePath) {
        return;
    }

    const image = new Image();
    image.src = imagePath;
    await image.decode();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.canvas.width = image.width;
    ctx.canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    const data = {
        data: new Float32Array(Array.from(imageData.data).map((x, i) => i % 4 < 3 ? mix(bounds[0], bounds[1], x / 255) : x)),
        width: imageData.width,
        height: imageData.height,
        numDimensions: 4
    };

    return data;
}