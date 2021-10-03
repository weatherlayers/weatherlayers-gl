/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export * from './layers/raster-layer/raster-layer';
export * from './layers/contour-layer/contour-layer';
export * from './layers/high-low-layer/high-low-layer';
export * from './layers/particle-layer/particle-layer';
export * from './layers/arcgis-raster-layer/arcgis-raster-layer';

export * from './controls/legend-control/legend-control';
export * from './controls/tooltip-control/tooltip-control';
export * from './controls/timeline-control/timeline-control';
export * from './controls/attribution-control/attribution-control';

export {getClientConfig, setClientConfig, loadStacCatalog, getStacCatalogCollectionIds, loadStacCollection, getStacCollectionItemDatetimes} from './utils/client';
export {formatDatetime, getClosestStartDatetime, getClosestEndDatetime} from './utils/datetime';