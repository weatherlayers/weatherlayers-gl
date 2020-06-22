/**
 * @param {string?} imagePath
 * @return {Promise<HTMLImageElement | undefined>}
 */
export async function loadImage(imagePath) {
    if (!imagePath) {
        return;
    }

    const image = new Image();
    image.src = imagePath;
    await new Promise(resolve => image.onload = resolve);
    return image;
}