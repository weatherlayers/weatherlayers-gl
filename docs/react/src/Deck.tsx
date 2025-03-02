import { useEffect, useState } from 'react';
import { DeckGL, MapView, TileLayer, BitmapLayer } from 'deck.gl';
import { ClipExtension } from '@deck.gl/extensions';
import { offsetDatetimeRange, RasterLayer, ParticleLayer } from 'weatherlayers-gl';
import { Client } from 'weatherlayers-gl/client';
import type { Dataset, DatasetData } from 'weatherlayers-gl/client';

import { WEATHER_LAYERS_ACCESS_TOKEN } from '../../auth.js';
import { BASEMAP_RASTER_STYLE_URL } from '../../basemap.js';

const DATASET = 'gfs/wind_10m_above_ground';
const CURRENT_DATETIME = new Date().toISOString();

const client = new Client({
  accessToken: WEATHER_LAYERS_ACCESS_TOKEN,
});

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasetData, setDatasetData] = useState<DatasetData | null>(null);

  useEffect(() => {
    const load = async () => {
      const dataset = await client.loadDataset(DATASET);
      const {datetimes} = await client.loadDatasetSlice(DATASET, offsetDatetimeRange(CURRENT_DATETIME, 0, 24));
      const datetime = datetimes[0];
      const datasetData = await client.loadDatasetData(DATASET, datetime);

      setDataset(dataset);
      setDatasetData(datasetData);
    };

    load();
  }, []);

  const {palette} = dataset ?? {};
  const {image, imageType, imageUnscale, bounds} = datasetData ?? {};

  return (
    <DeckGL
      width={'100%'}
      height={'100%'}
      views={new MapView({ repeat: true })}
      controller={{ normalize: false }}
      initialViewState={{
        longitude: 30,
        latitude: 10,
        zoom: 0,
      }}
      layers={[
        new TileLayer({
          id: 'basemap',
          data: BASEMAP_RASTER_STYLE_URL,
          minZoom: 0,
          maxZoom: 22,
          tileSize: 256,
          renderSubLayers: props => {
            const {bbox: {west, south, east, north}} = props.tile;
            return new BitmapLayer(props, {
              data: null,
              image: props.data,
              bounds: [west, south, east, north],
            });
          },
        }),
        new RasterLayer({
          id: 'raster',
          // data properties
          image,
          imageType,
          imageUnscale,
          bounds,
          // style properties
          visible: true,
          palette,
          opacity: 0.2,
          pickable: true,
          extensions: [new ClipExtension()],
          clipBounds: [-181, -85.051129, 181, 85.051129],
        }),
        new ParticleLayer({
          id: 'particle',
          // data properties
          image,
          imageType,
          imageUnscale,
          bounds,
          // style properties
          visible: true,
          numParticles: 5000,
          maxAge: 10,
          speedFactor: 10,
          width: 2,
          opacity: 0.2,
          animate: true,
          extensions: [new ClipExtension()],
          clipBounds: [-180, -85.051129, 180, 85.051129],
          getPolygonOffset: () => [0, -1000],
        }),
      ]}
    />
  );
}
