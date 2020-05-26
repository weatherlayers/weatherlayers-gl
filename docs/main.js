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
        particleSize: 1,
        particleColor: [255, 255, 255],
        particleOpacity: 0.8,
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

    const gui = new dat.GUI({ closed: true });
    gui.width = 300;
    gui.add(weather.config, 'particlesCount', 1, 1024 * 1024, 1).onFinishChange(weather.updateConfig);
    gui.add(weather.config, 'particleSize', 0.5, 5, 0.5);
    gui.addColor(weather.config, 'particleColor');
    gui.add(weather.config, 'particleOpacity', 0, 1, 0.01);
    gui.add(weather.config, 'fadeOpacity', 0.96, 0.999, 0.001).updateDisplay();
    gui.add(weather.config, 'speedFactor', 0.05, 1.0, 0.01);
    gui.add(weather.config, 'dropRate', 0, 0.1, 0.001);
    gui.add(weather.config, 'dropRateBump', 0, 0.2, 0.01);
    gui.add(weather.config, 'retina').onChange(weather.resize);
});