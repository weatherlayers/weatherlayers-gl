/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { StacCollection } from '../../utils/stac';

export interface LegendConfig {
  width: number;
  ticksCount: number;
  stacCollection: StacCollection;
  colormapBounds: [number, number];
  colormapUrl: string;
}