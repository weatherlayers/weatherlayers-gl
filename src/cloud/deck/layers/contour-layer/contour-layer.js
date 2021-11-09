/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/core';
import {ClipExtension} from '@deck.gl/extensions';
import {Texture2D} from '@luma.gl/core';
import {ContourLayer as BaseContourLayer} from '../../../../deck/layers/contour-layer/contour-layer';
import {getClient} from '../../../client/client';
import {getDatetimeWeight} from '../../../../_utils/datetime';
import {clipBounds} from '../../../../_utils/bounds';
import {formatValue} from '../../../../_utils/format';

const defaultProps = {
  ...BaseContourLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!props || !stacCollection || !image) {
      return [];
    }

    return [
      new BaseContourLayer(props, this.getSubLayerProps({
        id: 'path',
        image,
        imageType: stacCollection.summaries.imageType,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,
        formatValueFunction: x => formatValue(x, stacCollection.summaries.unit[0]).toString(),

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? clipBounds(stacCollection.extent.spatial.bbox[0]) : undefined,
      })),
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
        image: undefined,
        image2: undefined,
        imageWeight: undefined,
      });
      return;
    }

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await client.loadStacCollection(dataset);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
      const endDatetime = client.getStacCollectionClosestEndDatetime(this.state.stacCollection, datetime);
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