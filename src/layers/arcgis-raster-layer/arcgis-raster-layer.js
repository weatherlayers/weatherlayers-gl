/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {loadStacCollection, getStacCollectionProducer, getStacCollectionItemDatetimes, loadStacCollectionDataByDatetime} from '../../utils/client';
import {getClosestStartDatetime} from '../../utils/datetime';
import {colorTextureData} from '../../utils/data';

/** @typedef {import('@arcgis/core/layers/BaseTileLayer')} BaseTileLayer */

/**
 * @param {BaseTileLayer} baseTileLayer
 * @returns {BaseTileLayer}
 */
export function initArcGISRasterLayer(baseTileLayer) {
  return baseTileLayer.createSubclass({
    properties: {
      dataset: null,
      colormapBreaks: null,
    },

    load() {
      this.tileInfo.lods = [this.tileInfo.lods[0]];
      this.state = {};
    },

    /**
     * @param {number} level
     * @param {number} row
     * @param {number} col
     * @returns {Promise<HTMLCanvasElement>}
     */
    async fetchTile(level, row, col) {
      if (level > 0 || row > 0 || col > 0) {
        throw new Error('Invalid state');
      }

      const {dataset, datetime} = this;

      if (!this.state.stacCollection || dataset !== this.state.loadedDataset) {
        this.state.stacCollection = await loadStacCollection(dataset);
        this.state.datetimes = getStacCollectionItemDatetimes(this.state.stacCollection);

        const producer = getStacCollectionProducer(this.state.stacCollection);
        if (producer) {
          this.copyright = `<a href="${producer.url}" class="esri-attribution__link">${producer.name}</a> via <a href="https://weatherlayers.com" class="esri-attribution__link">WeatherLayers.com</a>`;
        }
      }

      if (!this.state.image || dataset !== this.state.loadedDataset || datetime !== this.state.loadedDatetime) {
        const startDatetime = getClosestStartDatetime(this.state.datetimes, datetime);
        if (!startDatetime) {
          return;
        }

        this.state.image = await loadStacCollectionDataByDatetime(dataset, startDatetime);
      }

      this.state.loadedDataset = dataset;
      this.state.loadedDatetime = datetime;

      const imageType = this.state.stacCollection.summaries.imageType;
      const imageBounds = this.state.stacCollection.summaries.imageBounds;
      const colormapBreaks = this.colormapBreaks || this.state.stacCollection.summaries.raster.colormapBreaks;
      const coloredImage = colorTextureData(this.state.image, imageType, imageBounds, colormapBreaks);

      return coloredImage;
    },
  });
}