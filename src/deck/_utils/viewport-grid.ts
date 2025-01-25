import type {Viewport} from '@deck.gl/core';
import {SphericalMercator} from '@mapbox/sphericalmercator';
import icomesh from 'icomesh';
import KDBush from 'kdbush';
import * as geokdbush from 'geokdbush';
import {isViewportGlobe, isViewportMercator, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds, getViewportZoom} from './viewport.js';
import {wrapLongitude} from './bounds.js';

const GLOBAL_POSITIONS_AT_ZOOM_CACHE = new Map<number, GeoJSON.Position[]>();
const GLOBAL_INDEX_AT_ZOOM_CACHE = new Map<number, KDBush>();

export function getViewportGridPositions(viewport: Viewport, zoomOffset: number = 0): GeoJSON.Position[] {
  let positions: GeoJSON.Position[];
  if (isViewportGlobe(viewport)) {
    const viewportGlobeCenter = getViewportGlobeCenter(viewport);
    const viewportGlobeRadius = getViewportGlobeRadius(viewport);
    const gridZoom = Math.floor(getViewportZoom(viewport) + zoomOffset + 1);
    positions = generateGlobeGrid(viewportGlobeCenter, viewportGlobeRadius, gridZoom);
  } else if (isViewportMercator(viewport)) {
    const viewportBounds = getViewportBounds(viewport);
    const gridZoom = Math.floor(getViewportZoom(viewport) + zoomOffset);
    positions = generateGrid(viewportBounds, gridZoom);
  } else {
    throw new Error('Invalid state');
  }
  return positions;
}

function generateGlobeGrid(center: GeoJSON.Position, radius: number, zoom: number): GeoJSON.Position[] {
  // icomesh performance
  // order 0 - 0.03 ms
  // order 1 - 0.40 ms
  // order 2 - 0.16 ms
  // order 3 - 0.59 ms
  // order 4 - 2.35 ms
  // order 5 - 7.27 ms
  // order 6 - 29.68 ms
  // order 7 - 66.05 ms
  // order 8 - 127.02 ms
  // order 9 - 555.85 ms
  // order 10 - 2460.47 ms
  // TODO: generate local icomesh
  const MAX_ICOMESH_ZOOM = 7;
  zoom = Math.min(Math.max(zoom - 2, 0), MAX_ICOMESH_ZOOM);

  const globalPositions = GLOBAL_POSITIONS_AT_ZOOM_CACHE.get(zoom) ?? (() => {
    const {uv} = icomesh(zoom, true);

    const globalPositions: GeoJSON.Position[] = [];
    for (let i = 0; i < uv.length; i += 2) {
      const uvX = uv[i];
      const uvY = uv[i + 1];

      // avoid duplicate grid points at the antimeridian
      if (uvX === 0) {
        continue;
      }
      // avoid invalid grid points at the poles
      if (uvY <= 0 || uvY >= 1) {
        continue;
      }

      const positionX = uvX * 360 - 180;
      const positionY = uvY * 180 - 90;

      globalPositions.push([positionX, positionY]);
    }

    // add simple grid points at poles
    globalPositions.push([0, -90]);
    globalPositions.push([0, 90]);

    return globalPositions;
  })();

  const globalIndex = GLOBAL_INDEX_AT_ZOOM_CACHE.get(zoom) ?? (() => {
    const globalIndex = new KDBush(globalPositions.length, undefined, Float32Array);
    for (let i = 0; i < globalPositions.length; i++) {
      const position = globalPositions[i];
      globalIndex.add(position[0], position[1]);
    }
    globalIndex.finish();
    return globalIndex;
  })();

  const ids = geokdbush.around(globalIndex, center[0], center[1], undefined, radius / 1000);
  const positions = ids.map(i => globalPositions[i]);

  return positions;
}

function generateGrid(bounds: GeoJSON.BBox, zoom: number): GeoJSON.Position[] {
  const mercator = new SphericalMercator({size: 1, antimeridian: true});

  const gridBounds = [...mercator.px([bounds[0], bounds[1]], zoom), ...mercator.px([bounds[2], bounds[3]], zoom)];
  [gridBounds[1], gridBounds[3]] = [gridBounds[3], gridBounds[1]];

  const size = 2 ** zoom;
  const lngCount = gridBounds[2] - gridBounds[0] + 1;
  const latCount = gridBounds[3] - gridBounds[1] + 1;

  const positions: GeoJSON.Position[] = [];
  for (let y = 0; y < latCount; y++) {
    for (let x = 0; x < lngCount; x++) {
      const i = gridBounds[0] + x;
      const j = gridBounds[1] + y + (i % 2 === 1 ? 0.5 : 0); // triangle grid
      const point: GeoJSON.Position = [i, j];

      // avoid duplicate grid points at the antimeridian
      if (point[0] === 0) {
        continue;
      }
      // avoid invalid grid points at the poles
      if (point[1] <= 0 || point[1] >= size) {
        continue;
      }

      const position = mercator.ll([point[0], point[1]], zoom);
      position[0] = wrapLongitude(position[0]);

      positions.push(position);
    }
  }

  return positions;
}