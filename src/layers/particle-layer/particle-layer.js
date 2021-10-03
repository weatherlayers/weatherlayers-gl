/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {CompositeLayer} from '@deck.gl/layers';
import {ClipExtension} from '@deck.gl/extensions';
import {Texture2D} from '@luma.gl/core';
import {ParticleLineLayer} from './particle-line-layer';
import {ImageType} from '../../utils/image-type';
import {getClient} from '../../utils/client';
import {getClosestStartDatetime, getClosestEndDatetime, getDatetimeWeight} from '../../utils/datetime';
import {clipBounds} from '../../utils/bounds';

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  dataset: {type: 'object', value: null, required: true},
  datetime: {type: 'object', value: null, required: true},
  datetimeInterpolate: false,
};

export class ParticleLayer extends CompositeLayer {
  renderLayers() {
    const {viewport} = this.context;
    const {props, stacCollection, image, image2, imageWeight} = this.state;
    const isGlobeViewport = !!viewport.resolution;

    if (!props || !stacCollection || !image) {
      return [];
    }
    if (stacCollection.summaries.imageType !== ImageType.VECTOR) {
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
        wrapLongitude: true,

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
        datetimes: undefined,
        image: undefined,
        image2: undefined,
        imageWeight: undefined,
      });
      return;
    }

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await client.loadStacCollection(dataset);
      this.state.datetimes = client.getStacCollectionItemDatetimes(this.state.stacCollection);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = getClosestStartDatetime(this.state.datetimes, datetime);
      const endDatetime = getClosestEndDatetime(this.state.datetimes, datetime);
      if (!startDatetime) {
        return;
      }

      const datetimeWeight = datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        let [image, image2] = await Promise.all([
          client.loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && client.loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);

        // create textures, to avoid a bug with async image props
        image = new Texture2D(gl, image);
        image2 = image2 && new Texture2D(gl, image2);
  
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