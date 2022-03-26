import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {ImageType} from '../../../_utils/image-type';
import {linearColormap, colorRampImage} from '../../../_utils/colormap';
import {code as fsDecl, tokens as fsDeclTokens} from './raster-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './raster-bitmap-layer-fs-main-end.glsl';

const defaultProps = {
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

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = undefined;
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

  getRasterValue(color) {
    const {colormapBreaks} = this.props;
    const colormapBounds = /** @type {[number, number]} */ ([colormapBreaks[0][0], colormapBreaks[colormapBreaks.length - 1][0]]);
    return colormapBounds[0] + color[0] / 255 * (colormapBounds[1] - colormapBounds[0]);
  }

  getRasterDirection(color) {
    const {imageType} = this.props;
    if (imageType === ImageType.VECTOR) {
      return color[1] / 255 * 360;
    } else {
      return NaN;
    }
  }

  getPickingInfo({info}) {
    const {imageType} = this.props;
    if (!info.color) {
      return info;
    }

    const value = this.getRasterValue(info.color);
    if (imageType === ImageType.VECTOR) {
      const direction = this.getRasterDirection(info.color);
      info.raster = { value, direction };
    } else {
      info.raster = { value };
    }

    return info;
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;