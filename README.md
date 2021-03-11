# weather-gl

<img src="docs/screenshot@2x.jpg" alt="Screenshot" width="720" height="360">

## Usage

```
const config = {
    overlay: {
        imagePath: `${basepath}/gfs/wind/${date}${time}.f${forecast}.png`, // data packed into an image, R channel = value, A channel = mask
        bounds: [0, 100], // data image scale bounds (0 in image = min bound, 255 in image = max bound)
        colorFunction: WeatherGl.Colors.µ.extendedSinebowColor, // function (i) => color, i in 0..1
        opacity: 0.1,
        legendTitle: 'Wind [m/s]',
        legendTicksCount: 6,
        legendWidth: 220,
    },
    particles: {
        imagePath: `${basepath}/gfs/wind/${date}${time}.f${forecast}.png`, // data packed into an image, G,B channels = u,v values, A channel = mask
        bounds: [-128, 127], // data image scale bounds (0 in image = min bound, 255 in image = max bound)
        count: 4096,
        size: 2,
        color: [255, 255, 255],
        opacity: 0.25,
        speedFactor: 33 / 100, // how fast the particles move
        maxAge: 100, // drop particles after max age in frames
        waves: false, // wave particle shape
    },
};

// preload the data image
config.overlay.image = await WeatherGl.loadImage(config.overlay.imagePath);
config.particles.image = await WeatherGl.loadImage(config.particles.imagePath);

const overlayLayer = new WeatherGl.OverlayLayer(config.overlay);
const particlesLayer = new WeatherGl.ParticlesLayer(config.particles);
const legendControl = new WeatherGl.LegendControl(config.overlay);

map.on('style.load', () => {
    map.addLayer(overlayLayer, 'waterway-label'); // beforeId='waterway-layer' allows to insert the overlay layer anywhere between existing layers
    map.addLayer(particlesLayer, 'waterway-label'); // beforeId='waterway-layer' doesn't have any effect for the particles layer, it is always above the map because of performance reasons
    map.addControl(legendControl, 'bottom-left');

    map.on('mousemove', e => {
        const overlayValue = overlayLayer.getPositionValue(e.lngLat);
        const particlesVector = particlesLayer.getPositionVector(e.lngLat);
        const particlesBearing = particlesLayer.getPositionBearing(e.lngLat);
        console.log(overlayValue, particlesVector, particlesBearing);
    });
});
```

## Development

```
npm install
npm run build
```

open http://localhost:8080/docs/

reference visualization: https://earth.nullschool.net/#2020/07/17/1200Z/wind/surface/level/equirectangular

## Backend dependencies

- gdal >=3.1.1
- curl
- jq

## Download data

```
data/download.sh 20200717 12 0
```