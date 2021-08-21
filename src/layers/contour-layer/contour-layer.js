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
    const {step} = this.props;
    const {stacCollection, image} = this.state;

    if (!stacCollection || !stacCollection.summaries.contour || !image) {
      return [];
    }

    return [
      new ContourCompositeLayer(this.props, this.getSubLayerProps({
        id: 'composite',
        image,
        imageBounds: stacCollection.summaries.imageBounds,
        step: step || stacCollection.summaries.contour.step,
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
          stacCollection,
          image,
        });
      });
    }
  }
}

ContourLayer.layerName = 'ContourLayer';
ContourLayer.defaultProps = defaultProps;