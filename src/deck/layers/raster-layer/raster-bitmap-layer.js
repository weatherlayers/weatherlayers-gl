import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {parsePalette, colorRampCanvas} from 'cpt2js';
import {ImageType} from '../../../_utils/image-type';
import {code as fsDecl, tokens as fsDeclTokens} from './raster-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './raster-bitmap-layer-fs-main-end.glsl';

const defaultProps = {
  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageInterpolate: {type: 'boolean', value: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  palette: {type: 'object', value: null}, // TODO: make required after colormapBreaks is removed
  colormapBreaks: {type: 'array', value: null}, // deprecated in 2022.5.0, use palette instead, TODO: remove
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
    const {palette} = props;
    const {colormapBreaks} = props; // TODO: remove after colormapBreaks is removed

    super.updateState({props, oldProps, changeFlags});

    if (
      palette !== oldProps.palette ||
      colormapBreaks !== oldProps.colormapBreaks // TODO: remove after colormapBreaks is removed
    ) {
      this.updatePaletteTexture();
    }
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageInterpolate, imageWeight, imageType, imageUnscale} = this.props;
    const {paletteTexture, paletteBounds} = this.state;

    if (!imageTexture || !paletteTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        bitmapTexture: imageTexture,
        [fsDeclTokens.bitmapTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsDeclTokens.imageTexelSize]: [1 / imageTexture.width, 1 / imageTexture.height],
        [fsDeclTokens.imageInterpolate]: imageInterpolate,
        [fsDeclTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsDeclTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsDeclTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsDeclTokens.paletteTexture]: paletteTexture,
        [fsDeclTokens.paletteBounds]: paletteBounds,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = undefined;
    }
  }

  updatePaletteTexture() {
    const {gl} = this.context;
    const palette = this.props.palette || this.props.colormapBreaks; // TODO: remove after colormapBreaks is removed

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