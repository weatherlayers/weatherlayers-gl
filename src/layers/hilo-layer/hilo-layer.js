/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {HiloTextLayer} from './hilo-text-layer';
import {loadStacCollection, loadStacCollectionDataByDatetime} from '../../utils/client';
import {formatValue} from '../../utils/value';

const defaultProps = {
  ...HiloTextLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
};

export class HiloLayer extends CompositeLayer {
  renderLayers() {
    const {props, stacCollection, image} = this.state;

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
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {dataset, datetime} = this.props;

    super.updateState({props, oldProps, changeFlags});

    if (
      dataset !== oldProps.dataset ||
      datetime !== oldProps.datetime
    ) {
      if (!dataset || !datetime) {
        this.setState({
          props: undefined,
          stacCollection: undefined,
          image: undefined,
        });
        return;
      }

      Promise.all([
        loadStacCollection(dataset),
        loadStacCollectionDataByDatetime(dataset, datetime),
      ]).then(([stacCollection, image]) => {
        this.setState({
          props: this.props,
          stacCollection,
          image,
        });
      });
    } else {
      this.setState({
        props: this.props,
      });
    }
  }
}

HiloLayer.layerName = 'HiloLayer';
HiloLayer.defaultProps = defaultProps;