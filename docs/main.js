window.addEventListener('DOMContentLoaded', async () => {
    const canvas = /** @type HTMLCanvasElement */ (document.getElementById('canvas'));
    const playPauseButton = /** @type HTMLButtonElement */ (document.getElementById('play-pause'));

    const layerFilenamePrefix = '../data/gfs/2020051500';
    const metadataFilename = `${layerFilenamePrefix}.json`;
    const imageFilename = `${layerFilenamePrefix}.png`;

    const metadata = await (await fetch(metadataFilename)).json();
    
    const image = new Image();
    image.src = imageFilename;
    await new Promise(resolve => image.onload = resolve);

    const weather = MaritraceMapboxWeather.drawWeather(canvas, metadata, image);

    playPauseButton.addEventListener('click', () => {
        if (weather.playing) {
            weather.pause();
        } else {
            weather.play();
        }
    });
});