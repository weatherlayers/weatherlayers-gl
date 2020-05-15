window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 720;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.body.appendChild(canvas);

    const layerFilenamePrefix = '../data/gfs/2020051500';
    const metadataFilename = `${layerFilenamePrefix}.json`;
    const imageFilename = `${layerFilenamePrefix}.png`;

    const metadata = await (await fetch(metadataFilename)).json();
    
    const image = new Image();
    image.src = imageFilename;
    await new Promise(resolve => image.onload = resolve);

    MaritraceMapboxWeather.drawWeather(canvas, metadata, image);
});