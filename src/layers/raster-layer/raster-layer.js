/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import {RasterBitmapLayer} from './raster-bitmap-layer';
import {loadStacCollection, loadStacCollectionDataByDatetime} from '../../utils/client';

const defaultProps = {
  ...RasterBitmapLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetime2: {type: 'object', value: null},
  datetimeWeight: {type: 'number', value: 0},
};

export class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {opacity} = this.props;
    const {stacCollection, image, image2, imageWeight} = this.state;

    if (!stacCollection || !stacCollection.summaries.raster || !image) {
      return [];
    }

    // apply gamma to opacity to make it visually "linear"
    const rasterOpacity = Math.pow(opacity, 1 / 2.2);

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        id: 'bitmap',
        image,
        image2,
        imageWeight,
        imageType: stacCollection.summaries.imageType,
        imageBounds: stacCollection.summaries.imageBounds,
        colormapBreaks: stacCollection.summaries.raster.colormapBreaks,
        // apply opacity in RasterBitmapLayer
        opacity: 1,
        rasterOpacity,
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {dataset, datetime, datetime2, datetimeWeight} = this.props;

    super.updateState({props, oldProps, changeFlags});

    if (
      dataset !== oldProps.dataset ||
      datetime !== oldProps.datetime ||
      datetime2 !== oldProps.datetime2
    ) {
      if (!dataset || !datetime) {
        this.setState({
          stacCollection: undefined,
          image: undefined,
          image2: undefined,
          imageWeight: undefined,
        });
        return;
      }

      Promise.all([
        loadStacCollection(dataset),
        loadStacCollectionDataByDatetime(dataset, datetime),
        datetime2 && loadStacCollectionDataByDatetime(dataset, datetime2),
      ]).then(([stacCollection, image, image2]) => {
        // create textures, to avoid a bug with async image props
        image = new Texture2D(gl, { data: image });
        image2 = image2 && new Texture2D(gl, { data: image2 });

        this.setState({
          stacCollection,
          image,
          image2,
          // sync imageWeight with images
          imageWeight: datetimeWeight,
        });
      });
    } else if (datetimeWeight !== oldProps.datetimeWeight) {
      this.setState({
        imageWeight: datetimeWeight,
      });
    }
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;