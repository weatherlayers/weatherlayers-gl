/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ContourPathLayer} from './contour-path-layer';
import {loadStacCollection, loadStacCollectionDataByDatetime} from '../../utils/client';

const defaultProps = {
  ...ContourPathLayer.defaultProps,

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
      new ContourPathLayer(props, this.getSubLayerProps({
        id: 'path',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        delta: props.delta || stacCollection.summaries.contour.delta,
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