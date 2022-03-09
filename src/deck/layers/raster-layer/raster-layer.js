import {CompositeLayer} from '@deck.gl/core';
import {createTextureCached} from '../../../_utils/texture';
import {withCheckLicense} from '../../license';
import {RasterBitmapLayer} from './raster-bitmap-layer';

const defaultProps = {
  ...RasterBitmapLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data
};

@withCheckLicense
class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {imageTexture, imageTexture2} = this.state;

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        id: 'bitmap',
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

    const imageTexture = image ? createTextureCached(gl, image) : null;
    const imageTexture2 = image2 ? createTextureCached(gl, image2) : null;

    this.setState({ imageTexture, imageTexture2 });
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;

export {RasterLayer};