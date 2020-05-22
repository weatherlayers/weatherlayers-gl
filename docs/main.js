window.addEventListener('DOMContentLoaded', async () => {
    const canvas = /** @type HTMLCanvasElement */ (document.getElementById('canvas'));
    const playPauseButton = /** @type HTMLButtonElement */ (document.getElementById('play-pause'));

    const layerFilenamePrefix = '../data/gfs/2020051500';
    const metadataFilename = `${layerFilenamePrefix}.json`;
    const imageFilename = `${layerFilenamePrefix}.png`;

    const config = {
        weatherMetadata: metadataFilename,
        weatherImage: imageFilename,
        particlesCount: 1024 * 4,
        fadeOpacity: 0.996, // how fast the particle trails fade on each frame
        speedFactor: 0.25, // how fast the particles move
        dropRate: 0.003, // how often the particles move to a random place
        dropRateBump: 0.01, // drop rate increase relative to individual particle speed
        retina: true,
    };

    const weather = await MaritraceMapboxWeather.drawWeather(canvas, config);

    playPauseButton.addEventListener('click', () => {
        if (weather.playing) {
            weather.pause();
        } else {
            weather.play();
        }
    });
});