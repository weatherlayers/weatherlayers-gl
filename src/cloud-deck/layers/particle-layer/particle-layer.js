import {CompositeLayer} from '@deck.gl/core';
import {ClipExtension} from '@deck.gl/extensions';
import {ParticleLayer as BaseParticleLayer} from '../../../deck/layers/particle-layer/particle-layer';
import {ImageType} from '../../../_utils/image-type';
import {getClient} from '../../../cloud-client/client';
import {getDatetimeWeight} from '../../../_utils/datetime';
import {clipBounds} from '../../../_utils/bounds';

const defaultProps = {
  ...BaseParticleLayer.defaultProps,

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
      new BaseParticleLayer(props, this.getSubLayerProps({
        id: 'base',
        image,
        image2,
        imageWeight,
        imageUnscale: image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray ? stacCollection.summaries.imageBounds : null, // TODO: rename to imageUnscale in catalog
        maxAge: props.maxAge || stacCollection.summaries.particle.maxAge,
        speedFactor: props.speedFactor || stacCollection.summaries.particle.speedFactor,
        width: props.width || stacCollection.summaries.particle.width,

        bounds: stacCollection.extent.spatial.bbox[0],
        extensions: !isGlobeViewport ? [new ClipExtension()] : [],
        clipBounds: !isGlobeViewport ? clipBounds(stacCollection.extent.spatial.bbox[0]) : undefined,
      })),
    ];
  }

  initializeState() {
    const client = getClient();
    this.setState({ client });
  }

  async updateState({props, oldProps, changeFlags}) {
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
        image: undefined,
        image2: undefined,
        imageWeight: undefined,
      });
      return;
    }

    if (!this.state.stacCollection || dataset !== oldProps.dataset) {
      this.state.stacCollection = await client.loadStacCollection(dataset);
    }

    if (!this.state.image || dataset !== oldProps.dataset || datetime !== oldProps.datetime) {
      const startDatetime = client.getStacCollectionClosestStartDatetime(this.state.stacCollection, datetime);
      const endDatetime = client.getStacCollectionClosestEndDatetime(this.state.stacCollection, datetime);
      if (!startDatetime) {
        return;
      }

      const imageWeight = datetimeInterpolate && endDatetime ? getDatetimeWeight(startDatetime, endDatetime, datetime) : 0;

      if (dataset !== oldProps.dataset || startDatetime !== this.state.startDatetime || endDatetime !== this.state.endDatetime) {
        const [image, image2] = await Promise.all([
          client.loadStacCollectionDataByDatetime(dataset, startDatetime),
          endDatetime && client.loadStacCollectionDataByDatetime(dataset, endDatetime),
        ]);
  
        this.setState({ image, image2 });
      }

      this.setState({ startDatetime, endDatetime, imageWeight });
    }
    
    this.setState({ props: this.props });
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;