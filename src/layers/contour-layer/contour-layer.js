/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {ClipExtension} from '@deck.gl/extensions';
import {Texture2D} from '@luma.gl/core';
import {ContourPathLayer} from './contour-path-layer';
import {ContourBitmapLayer} from './contour-bitmap-layer';
import {getClient} from '../../utils/client';
import {getClosestStartDatetime, getClosestEndDatetime, getDatetimeWeight} from '../../utils/datetime';
import {clipBounds} from '../../utils/bounds';

const defaultProps = {
  ...ContourBitmapLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
  gpu: false,
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {gpu} = this.props;
    const {props, stacCollection, image, image2, imageWeight} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!props || !stacCollection || !image) {
      return [];
    }

    return [
      !gpu ? new ContourPathLayer(props, this.getSubLayerProps({
        id: 'path',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? clipBounds(stacCollection.extent.spatial.bbox[0]) : undefined,
      })) : null,
      gpu ? new ContourBitmapLayer(props, this.getSubLayerProps({
        id: 'bitmap',
        image,
        image2,
        imageWeight,
        imageType: stacCollection.summaries.imageType,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,
        opacity: 1, // apply separate opacity
        rasterOpacity: Math.pow(props.opacity, 1 / 2.2), // apply gamma to opacity to make it visually "linear"

        bounds: stacCollection.extent.spatial.bbox[0],
        _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? clipBounds(stacCollection.extent.spatial.bbox[0]) : undefined,
      })) : null,
    ];
  }

  initializeState() {
    this.setState({
      client: getClient(),
    });
  }

  async updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {dataset, datetime, datetimeInterpolate, visible} = this.props;
    const {client} = this.state;

    super.updateState({props, oldProps, changeFlags});

    if (!visible) {
      return;
    }

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
      this.state.stacCollection = await client.loadStacCollection(dataset);
      this.state.datetimes = client.getStacCollectionItemDatetimes(this.state.stacCollection);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = getClosestStartDatetime(this.state.datetimes, datetime);
      const endDatetime = getClosestEndDatetime(this.state.datetimes, datetime);
      if (!startDatetime) {
        return;
      }

      const datetimeWeight = datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          client.loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && client.loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);

        if (this.props.gpu) {
          // create textures, to avoid a bug with async image props
          image = new Texture2D(gl, image);
          image2 = image2 && new Texture2D(gl, image2);
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