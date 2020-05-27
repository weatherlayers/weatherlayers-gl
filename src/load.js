/**
 * @param {string} metadataPath
 * @return {Promise<Record<string, any>>}
 */
export async function loadMetadata(metadataPath) {
    const metadata = await (await fetch(metadataPath)).json();
    return metadata;
}

/**
 * @param {string} imagePath
 * @return {Promise<HTMLImageElement>}
 */
export async function loadImage(imagePath) {
    const image = new Image();
    image.src = imagePath;
    await new Promise(resolve => image.onload = resolve);
    return image;
}