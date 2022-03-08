import {CompositeLayer} from '@deck.gl/core';
import {Texture2D} from '@luma.gl/core';
import {withCheckLicense} from '../../../_utils/license';
import {ParticleLineLayer} from './particle-line-layer';

const defaultProps = {
  ...ParticleLineLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
};

@withCheckLicense
class ParticleLayer extends CompositeLayer {
  renderLayers() {
    const {imageTexture, imageTexture2} = this.state;

    return [
      new ParticleLineLayer(this.props, this.getSubLayerProps({
        id: 'line',
        imageTexture,
        imageTexture2,
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, image2, imageUnscale} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== oldProps.image || image2 !== oldProps.image2) {
      this.updateTexture();
    }
  }

  updateTexture() {
    const {gl} = this.context;
    const {image, image2} = this.props;

    const imageTexture = image ? new Texture2D(gl, image) : null;
    const imageTexture2 = image2 ? new Texture2D(gl, image2) : null;

    this.setState({ imageTexture, imageTexture2 });
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;

export {ParticleLayer};