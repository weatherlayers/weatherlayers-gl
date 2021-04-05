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
 * @param {[number, number]} imageBounds
 * @param {{ vector?: boolean; vectorToScalar?: boolean }} [options]
 * @return {Promise<{ data: Float32Array, width: number, height: number, numDimensions: number } | undefined>}
 */
export async function loadImage(imagePath, imageBounds, options = {}) {
    if (!imagePath) {
        return;
    }

    const image = new Image();
    image.src = imagePath;
    await image.decode();

    const width = image.width;
    const height = image.height;
    const numPixels = width * height;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    const numDimensions = options.vector && !options.vectorToScalar ? 2 : 1;
    const data = new Float32Array(width * height * numDimensions);
    for (let i = 0; i < numPixels; i++) {
        const a = imageData.data[i * 4 + 3];
        const u = a === 255 ? mix(imageBounds[0], imageBounds[1], imageData.data[i * 4] / 255) : NaN;
        const v = a === 255 ? mix(imageBounds[0], imageBounds[1], imageData.data[i * 4 + 1] / 255) : NaN;

        if (options.vector) {
            if (options.vectorToScalar) {
                const scalar = Math.sqrt(u * u + v * v);
                data[i * numDimensions] = scalar;
            } else {
                data[i * numDimensions] = u;
                data[i * numDimensions + 1] = v;
            }
        } else {
            data[i * numDimensions] = u;
        }
    }

    const wrapper = { data, width, height, numDimensions };
    return wrapper;
}