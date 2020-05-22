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

    const gui = new dat.GUI();
    gui.width = 300;
    gui.add(weather.config, 'particlesCount', 1024, 1024 * 1024).step(1).onChange(weather.updateConfig);
    gui.add(weather.config, 'fadeOpacity', 0.96, 0.999).step(0.001);
    gui.add(weather.config, 'speedFactor', 0.05, 1.0).step(0.01);
    gui.add(weather.config, 'dropRate', 0, 0.1).step(0.01);
    gui.add(weather.config, 'dropRateBump', 0, 0.2).step(0.01);
    if (window.devicePixelRatio !== 1) {
        gui.add(weather.config, 'retina').onChange(weather.resize);
    }
});