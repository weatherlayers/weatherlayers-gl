/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ClipExtension} from '@deck.gl/extensions';
import {HiloTextLayer} from './hilo-text-layer';
import {loadStacCollection, getStacCollectionItemDatetimes, loadStacCollectionDataByDatetime} from '../../utils/client';
import {getClosestStartDatetime, getClosestEndDatetime, getDatetimeWeight} from '../../utils/datetime';
import {formatValue} from '../../utils/value';

const defaultProps = {
  ...HiloTextLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class HiloLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!props || !stacCollection || !stacCollection.summaries.hilo || !image) {
      return [];
    }

    return [
      new HiloTextLayer(props, this.getSubLayerProps({
        id: 'text',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        radius: props.radius || stacCollection.summaries.hilo.radius,
        contour: props.contour || stacCollection.summaries.hilo.contour,
        formatValueFunction: x => formatValue(x, stacCollection.summaries.unit[0]).toString(),

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? [-360, -85.051129, 360, 85.051129] : undefined,
      })),
    ];
  }

  async updateState({props, oldProps, changeFlags}) {
    const {dataset, datetime, datetimeInterpolate} = this.props;

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

      const datetimeWeight = datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);
  
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

HiloLayer.layerName = 'HiloLayer';
HiloLayer.defaultProps = defaultProps;