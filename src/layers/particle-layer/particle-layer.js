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
};

export class ParticleLayer extends CompositeLayer {
  renderLayers() {
    return [
      new ParticleLineLayer(this.props, {
        id: `${this.id}-line`,
      }),
    ];
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;