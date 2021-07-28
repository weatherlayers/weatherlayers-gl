/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface LegendConfig {
  legendColormapUrl: string;
  legendWidth: number;
  legendTitle: string;
  colormapBounds: [number, number];
  legendTicksCount: number;
  legendValueFormatter?: (value: number) => number;
  legendValueDecimals?: number;
}