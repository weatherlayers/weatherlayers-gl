import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {parsePalette, colorRampCanvas} from 'cpt2js';
import {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import {ImageType} from '../../../_utils/image-type.js';
import {sourceCode as fs, tokens as fsTokens} from './raster-bitmap-layer.fs.glsl';

/** @typedef {import('../../../_utils/raster-picking-info').RasterPickingInfo} RasterPickingInfo */

const defaultProps = {
  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'string', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  palette: {type: 'object', value: null, required: true},
};

export class RasterBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      fs: fs,
    };
  }

  updateState({props, oldProps, changeFlags}) {
    const {palette} = props;

    super.updateState({props, oldProps, changeFlags});

    if (palette !== oldProps.palette) {
      this.updatePaletteTexture();
    }
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale} = this.props;
    const {paletteTexture, paletteBounds} = this.state;

    if (!imageTexture || !paletteTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        [fsTokens.imageTexture]: imageTexture,
        [fsTokens.imageTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
        [fsTokens.imageSmoothing]: imageSmoothing,
        [fsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
        [fsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsTokens.paletteTexture]: paletteTexture,
        [fsTokens.paletteBounds]: paletteBounds,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = undefined;
    }
  }

  updatePaletteTexture() {
    const {gl} = this.context;
    const {palette} = this.props;

    const paletteScale = parsePalette(palette);
    const paletteDomain = paletteScale.domain();
    const paletteBounds = /** @type {[number, number]} */ ([paletteDomain[0], paletteDomain[paletteDomain.length - 1]]);
    const paletteCanvas = colorRampCanvas(paletteScale);
    const paletteTexture = new Texture2D(gl, {
      data: paletteCanvas,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
        [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
      },
    });

    this.setState({ paletteTexture, paletteBounds });
  }

  getRasterValue(color) {
    const {paletteBounds} = this.state;

    return paletteBounds[0] + color[0] / 255 * (paletteBounds[1] - paletteBounds[0]);
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


    /** @type {RasterPickingInfo} */
    let rasterPickingInfo;
    const value = this.getRasterValue(info.color);
    if (imageType === ImageType.VECTOR) {
      const direction = this.getRasterDirection(info.color);
      rasterPickingInfo = { value, direction };
    } else {
      rasterPickingInfo = { value };
    }
    info.raster = rasterPickingInfo;

    return info;
  }
}

RasterBitmapLayer.layerName = 'RasterBitmapLayer';
RasterBitmapLayer.defaultProps = defaultProps;