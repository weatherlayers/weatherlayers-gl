import type { Viewport, WebMercatorViewport, _GlobeViewport as GlobeViewport, LayerExtension } from '@deck.gl/core';
import { ClipExtension } from '@deck.gl/extensions';
import { distance } from './geodesy.js';
import { wrapBounds, clipBounds } from './bounds.js';

export function isViewportGlobe(viewport: Viewport): viewport is GlobeViewport {
  return !!viewport.resolution;
}

export function isViewportMercator(viewport: Viewport): viewport is WebMercatorViewport {
  return !isViewportGlobe(viewport);
}

export function isViewportInZoomBounds(viewport: Viewport, minZoom: number | null, maxZoom: number | null): boolean {
  if (minZoom != null && viewport.zoom < minZoom) {
    return false;
  }
  if (maxZoom != null && viewport.zoom > maxZoom) {
    return false;
  }
  return true;
}

export function getViewportGlobeCenter(viewport: GlobeViewport): GeoJSON.Position {
  return [viewport.longitude, viewport.latitude];
}

export function getViewportGlobeRadius(viewport: GlobeViewport): number {
  const viewportGlobeCenter = getViewportGlobeCenter(viewport);
  const viewportGlobeRadius = Math.max(
    distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, 0])),
    distance(viewportGlobeCenter, viewport.unproject([0, viewport.height / 2])),
    ...(viewport.width > viewport.height ? [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 2 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 3, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height, viewport.height / 2])),
    ] : [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 2 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 3])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width])),
    ])
  );
  return viewportGlobeRadius;
}

export function getViewportBounds(viewport: WebMercatorViewport): GeoJSON.BBox {
  return wrapBounds(viewport.getBounds());
}

// TODO: report deck.gl bug
export function getViewportPixelOffset(viewport: Viewport, offset: number): number {
  return offset * (isViewportGlobe(viewport) ? -1 : 1);
}

// TODO: report deck.gl bug
export function getViewportAngle(viewport: Viewport, angle: number): number {
  return angle + (isViewportGlobe(viewport) ? 180 : 0);
}

// remove or use?
export function getViewportClipExtensions(viewport: Viewport): LayerExtension[] {
  return !isViewportGlobe(viewport) ? [new ClipExtension()] : [];
}

export function getViewportClipBounds(viewport: WebMercatorViewport, bounds: GeoJSON.BBox): GeoJSON.BBox;
export function getViewportClipBounds(viewport: Viewport, bounds: GeoJSON.BBox): GeoJSON.BBox | null {
  return isViewportMercator(viewport) ? clipBounds(bounds) : null;
}