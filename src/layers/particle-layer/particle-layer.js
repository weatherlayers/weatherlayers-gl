/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ParticleLineLayer} from './particle-line-layer';

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  stacCollection: { type: 'object', value: null, required: true },
};

export class ParticleLayer extends CompositeLayer {
  renderLayers() {
    const {stacCollection} = this.props;

    if (!stacCollection) {
      return [];
    }

    return [
      new ParticleLineLayer(this.props, {
        id: `${this.id}-line`,
        imageBounds: stacCollection.summaries.particle.imageBounds,
      }),
    ];
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;