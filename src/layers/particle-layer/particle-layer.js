/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import {ParticleLineLayer} from './particle-line-layer';
import {loadStacCollection, loadStacCollectionDataByDatetime} from '../../utils/client';

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetime2: {type: 'object', value: null},
  datetimeWeight: {type: 'number', value: 0},
};

export class ParticleLayer extends CompositeLayer {
  renderLayers() {
    const {maxAge, speedFactor, width} = this.props;
    const {stacCollection, image, image2, imageWeight} = this.state;

    if (!stacCollection || !stacCollection.summaries.particle || !image) {
      return [];
    }

    return [
      new ParticleLineLayer(this.props, this.getSubLayerProps({
        id: 'line',
        image,
        image2,
        imageWeight,
        imageBounds: stacCollection.summaries.particle.imageBounds,
        maxAge: maxAge || stacCollection.summaries.particle.maxAge,
        speedFactor: speedFactor || stacCollection.summaries.particle.speedFactor,
        width: width || stacCollection.summaries.particle.width,
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
        });
        return;
      }

      Promise.all([
        loadStacCollection(dataset),
        loadStacCollectionDataByDatetime(dataset, datetime),
        datetime2 && loadStacCollectionDataByDatetime(dataset, datetime2),
      ]).then(([stacCollection, image, image2]) => {
        image = new Texture2D(gl, { data: image });
        image2 = image2 && new Texture2D(gl, { data: image2 });

        this.setState({
          stacCollection,
          image,
          image2,
          imageWeight: datetimeWeight,
        });
      });
    } else {
      this.setState({
        imageWeight: datetimeWeight,
      });
    }
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;