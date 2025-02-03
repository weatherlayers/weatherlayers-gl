import { useEffect, useState } from 'react';
import { Map, useControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapView } from 'deck.gl';
import type { DeckProps } from 'deck.gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ClipExtension } from '@deck.gl/extensions';
import { setLicense, offsetDatetimeRange, RasterLayer, ParticleLayer } from 'weatherlayers-gl';
import { Client } from 'weatherlayers-gl/client';
import type { Dataset, DatasetData } from 'weatherlayers-gl/client';

import { WEATHER_LAYERS_ACCESS_TOKEN, MAPBOX_ACCESS_TOKEN } from '../../auth.js';
import { BASEMAP_VECTOR_STYLE_URL, BASEMAP_VECTOR_LAYER_BEFORE_ID, updateBasemapVectorStyle } from '../../basemap.js';
import LICENSE from '../../license.json';

const DATASET = 'gfs/wind_10m_above_ground';
const CURRENT_DATETIME = new Date().toISOString();

setLicense(LICENSE);
const client = new Client({
  accessToken: WEATHER_LAYERS_ACCESS_TOKEN,
});

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function Maplibre() {
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
    <Map
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      mapStyle={BASEMAP_VECTOR_STYLE_URL}
      initialViewState={{
        longitude: 30,
        latitude: 10,
        zoom: 0,
      }}
      onLoad={e => updateBasemapVectorStyle(e.target)}
    >
      <DeckGLOverlay
        interleaved
        views={new MapView({ repeat: true })}
        controller={{ normalize: false }}
        layers={[
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
            beforeId: BASEMAP_VECTOR_LAYER_BEFORE_ID,
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
            beforeId: BASEMAP_VECTOR_LAYER_BEFORE_ID,
          }),
        ]}
      />
    </Map>
  );
}
