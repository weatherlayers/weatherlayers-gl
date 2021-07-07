/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface LegendConfig {
  colormapUrl: string;
  legendWidth: number;
  legendTitle: string;
  colorBounds: [number, number];
  legendTicksCount: number;
  legendValueFormat?: (value: number) => number;
  legendValueDecimals?: number;
}