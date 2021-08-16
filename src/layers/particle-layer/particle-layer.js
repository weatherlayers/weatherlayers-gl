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
import {loadStacCollection, getStacCollectionItemDatetimes, loadStacCollectionDataByDatetime} from '../../utils/client';
import {getClosestStartDatetime, getClosestEndDatetime, getDatetimeWeight} from '../../utils/datetime';

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
};

export class ParticleLayer extends CompositeLayer {
  renderLayers() {
    const {props, stacCollection, image, image2, imageWeight} = this.state;

    if (!props || !stacCollection || !stacCollection.summaries.particle || !image) {
      return [];
    }

    return [
      new ParticleLineLayer(props, this.getSubLayerProps({
        id: 'line',
        image,
        image2,
        imageWeight,
        imageBounds: stacCollection.summaries.imageBounds,
        maxAge: props.maxAge || stacCollection.summaries.particle.maxAge,
        speedFactor: props.speedFactor || stacCollection.summaries.particle.speedFactor,
        width: props.width || stacCollection.summaries.particle.width,
      })),
    ];
  }

  async updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {dataset, datetime} = this.props;

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

      const datetimeWeight = endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);

        // create textures, to avoid a bug with async image props
        image = new Texture2D(gl, { data: image });
        image2 = image2 && new Texture2D(gl, { data: image2 });
  
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

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;