/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {colorTextureData} from '../../../_utils/data';

/** @typedef {import('@arcgis/core/layers/BaseTileLayer')} BaseTileLayer */
/** @typedef {import('../../../_utils/image-type').ImageType} ImageType */
/** @typedef {import('../../../_utils/colormap').ColormapBreak} ColormapBreak */
/** @typedef {import('../../../_utils/data').TextureData} TextureData */

/**
 * @param {BaseTileLayer} baseTileLayer
 * @returns {BaseTileLayer}
 */
export function initRasterLayer(baseTileLayer) {
  return baseTileLayer.createSubclass({
    properties: {
      image: null,
      imageType: null,
      imageBounds: null,
      colormapBreaks: null,
    },

    load() {
      this.tileInfo.lods = [this.tileInfo.lods[0]];
    },

    /**
     * @param {number} level
     * @param {number} row
     * @param {number} col
     * @param {{ signal: { aborted: boolean }}} options
     * @returns {Promise<HTMLCanvasElement>}
     */
    async fetchTile(level, row, col, options) {
      if (level > 0 || row > 0 || col > 0) {
        throw new Error('Invalid state');
      }

      if (options.signal.aborted) {
        throw new Error('Aborted');
      }

      const image = this.image;
      const imageType = this.imageType;
      const imageBounds = this.imageBounds;
      const colormapBreaks = this.colormapBreaks;
      const renderedImage = this.renderImage(image, imageType, imageBounds, colormapBreaks);
      return renderedImage;
    },

    /**
     * @param {TextureData} image
     * @param {ImageType} imageType
     * @param {[number, number]} imageBounds
     * @param {ColormapBreak[]} colormapBreaks
     * @returns {HTMLCanvasElement}
     */
    renderImage(image, imageType, imageBounds, colormapBreaks) {
      const coloredImage = colorTextureData(image, imageType, imageBounds, colormapBreaks);
      return coloredImage;
    },
  });
}