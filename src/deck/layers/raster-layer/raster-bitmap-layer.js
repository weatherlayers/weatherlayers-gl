import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {code as fsDecl, tokens as fsDeclTokens} from './raster-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './raster-bitmap-layer-fs-main-end.glsl';
import {ImageType} from '../../../_utils/image-type';
import {linearColormap, colorRampImage} from '../../../_utils/colormap';

const defaultProps = {
  ...BitmapLayer.defaultProps,

  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  colormapBreaks: {type: 'array', value: null, required: true},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class RasterBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  updateState({props, oldProps, changeFlags}) {
    const {colormapBreaks} = props;

    super.updateState({props, oldProps, changeFlags});

    if (colormapBreaks !== oldProps.colormapBreaks) {
      this.updateColormapTexture();
    }
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageWeight, imageType, imageUnscale, rasterOpacity} = this.props;
    const {colormapTexture, colormapBounds} = this.state;

    if (!imageTexture || !colormapTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        bitmapTexture: imageTexture,
        [fsDeclTokens.bitmapTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsDeclTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsDeclTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsDeclTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsDeclTokens.colormapTexture]: colormapTexture,
        [fsDeclTokens.colormapBounds]: colormapBounds,
        [fsDeclTokens.rasterOpacity]: rasterOpacity,
      });

      super.draw(opts);
    }
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

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;