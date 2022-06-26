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

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
};

@withCheckLicense(defaultProps)
class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {props, imageTexture, imageTexture2} = this.state;

    if (!props || !imageTexture) {
      return [];
    }

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        id: 'bitmap',
        imageTexture,
        imageTexture2,
        image: undefined,
        image2: undefined,
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, image2, imageInterpolate, imageUnscale} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== oldProps.image || image2 !== oldProps.image2 || imageInterpolate !== oldProps.imageInterpolate) {
      this.updateTexture();
    }

    this.setState({ props });
  }

  updateTexture() {
    const {gl} = this.context;
    const {image, image2, imageInterpolate} = this.props;

    const imageTexture = image ? createTextureCached(gl, image, imageInterpolate) : null;
    const imageTexture2 = image2 ? createTextureCached(gl, image2, imageInterpolate) : null;

    this.setState({ imageTexture, imageTexture2 });
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;

export {RasterLayer};