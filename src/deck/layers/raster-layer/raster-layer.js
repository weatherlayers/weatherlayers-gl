import {CompositeLayer} from '@deck.gl/core';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {withCheckLicense} from '../../../_utils/license';
import {linearColormap, colorRampImage} from '../../../_utils/colormap';
import {RasterBitmapLayer} from './raster-bitmap-layer';

const defaultProps = {
  ...RasterBitmapLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null, required: true}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data

  colormapTexture: undefined,
  colormapBounds: undefined,
  colormapBreaks: {type: 'array', value: null, required: true},
};

@withCheckLicense
class RasterLayer extends CompositeLayer {
  renderLayers() {
    const {imageTexture, imageTexture2, colormapTexture, colormapBounds} = this.state;

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        id: 'bitmap',
        imageTexture,
        imageTexture2,
        colormapTexture,
        colormapBounds,
      })),
    ];
  }

  updateState({props, oldProps, changeFlags}) {
    const {image, image2, imageUnscale, colormapBreaks} = props;

    super.updateState({props, oldProps, changeFlags});

    if (imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== oldProps.image || image2 !== oldProps.image2) {
      this.updateTexture();
    }

    if (colormapBreaks !== oldProps.colormapBreaks) {
      this.updateColormapTexture();
    }
  }

  updateTexture() {
    const {gl} = this.context;
    const {image, image2} = this.props;

    const imageTexture = image ? new Texture2D(gl, image) : null;
    const imageTexture2 = image2 ? new Texture2D(gl, image2) : null;

    this.setState({ imageTexture, imageTexture2 });
  }

  updateColormapTexture() {
    const {gl} = this.context;
    const {colormapBreaks} = this.props;

    const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);
    const colormapFunction = linearColormap(colormapBreaks);
    const colormapImage = colorRampImage(colormapFunction, colormapBounds);
    const colormapTexture = new Texture2D(gl, {
      data: colormapImage,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
        [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
      },
    });

    this.setState({ colormapTexture, colormapBounds });
  }
}

RasterLayer.layerName = 'RasterLayer';
RasterLayer.defaultProps = defaultProps;

export {RasterLayer};