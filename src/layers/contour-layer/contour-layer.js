/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ContourCompositeLayer} from './contour-composite-layer';
import {loadStacCollection, loadStacCollectionDataByDatetime} from '../../utils/client';

const defaultProps = {
  ...ContourCompositeLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
};

export class ContourLayer extends CompositeLayer {
  renderLayers() {
    const {props, stacCollection, image} = this.state;

    if (!props || !stacCollection || !stacCollection.summaries.contour || !image) {
      return [];
    }

    return [
      new ContourCompositeLayer(props, this.getSubLayerProps({
        id: 'composite',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        step: props.step || stacCollection.summaries.contour.step,
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

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;