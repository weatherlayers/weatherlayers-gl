/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import {ContourPathLayer} from './contour-path-layer';
import {ContourBitmapLayer} from './contour-bitmap-layer';
import {loadStacCollection, getStacCollectionItemDatetimes, loadStacCollectionDataByDatetime} from '../../utils/client';
import {getClosestStartDatetime, getClosestEndDatetime, getDatetimeWeight} from '../../utils/datetime';

const defaultProps = {
  ...ContourBitmapLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  experimental: false,
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {experimental} = this.props;
    const {props, stacCollection, image, image2, imageWeight} = this.state;

    if (!props || !stacCollection || !stacCollection.summaries.contour || !image) {
      return [];
    }

    return [
      !experimental ? new ContourPathLayer(props, this.getSubLayerProps({
        id: 'path',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,
      })) : null,
      experimental ? new ContourBitmapLayer(props, this.getSubLayerProps({
        id: 'bitmap',
        image,
        image2,
        imageWeight,
        imageType: stacCollection.summaries.imageType,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,
        // apply opacity in ContourBitmapLayer
        opacity: 1,
        rasterOpacity: Math.pow(props.opacity, 1 / 2.2), // apply gamma to opacity to make it visually "linear"
      })) : null,
    ];
  }

  async updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {dataset, datetime} = this.props;

    super.updateState({props, oldProps, changeFlags});

    if (!dataset || !datetime) {
      this.setState({
        props: undefined,
        stacCollection: undefined,
        datetimes: undefined,
        image: undefined,
        image2: undefined,
        imageWeight: undefined,
      });
      return;
    }

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await loadStacCollection(dataset);
      this.state.datetimes = getStacCollectionItemDatetimes(this.state.stacCollection);
    }

    if (dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = getClosestStartDatetime(this.state.datetimes, datetime);
      const endDatetime = getClosestEndDatetime(this.state.datetimes, datetime);
      if (!startDatetime) {
        return;
      }

      const datetimeWeight = endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);

        // create textures, to avoid a bug with async image props
        if (this.props.experimental) {
          image = new Texture2D(gl, { data: image });
          image2 = image2 && new Texture2D(gl, { data: image2 });
        }
  
        this.setState({
          image,
          image2,
        });
      }

      this.setState({
        startDatetime,
        endDatetime,
        imageWeight: datetimeWeight,
      });
    }
    
    this.setState({
      props: this.props,
    });
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;