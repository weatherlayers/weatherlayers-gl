import type {DefaultProps, UpdateParameters, GetPickingInfoParams, PickingInfo} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import type {BitmapLayerProps, BitmapBoundingBox} from '@deck.gl/layers/typed'
import {Texture2D} from '@luma.gl/core';
import {parsePalette, colorRampCanvas} from 'cpt2js';
import type {Palette} from 'cpt2js';
import GL from '../../../_utils/gl.js';
import {ensureDefaultProps} from '../../../_utils/props.js';
import {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import {RasterPickingInfo} from '../../../_utils/raster-picking-info.js';
import {sourceCode as fs, tokens as fsTokens} from './raster-bitmap-layer.fs.glsl';

export type RasterBitmapLayerProps = BitmapLayerProps & {
  imageTexture: Texture2D | null;
  imageTexture2: Texture2D | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: BitmapBoundingBox;

  palette: Palette | null;
};

const defaultProps: DefaultProps<RasterBitmapLayerProps> = {
  imageTexture: {type: 'object', value: null},
  imageTexture2: {type: 'object', value: null},
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'object', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'object', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  palette: {type: 'object', value: null},
};

export class RasterBitmapLayer extends BitmapLayer<RasterBitmapLayerProps> {
  static layerName = 'RasterBitmapLayer';
  static defaultProps = defaultProps;

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      fs: fs,
    };
  }

  updateState(params: UpdateParameters<this>): void {
    const {palette} = params.props;

    super.updateState(params);

    if (palette !== params.oldProps.palette) {
      this.#updatePaletteTexture();
    }
  }

  draw(opts: any): void {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale} = ensureDefaultProps(this.props, defaultProps);
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
      this.props.image = null;
    }
  }

  #updatePaletteTexture(): void {
    const {gl} = this.context;
    const {palette} = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      return;
    }

    const paletteScale = parsePalette(palette);
    const paletteDomain = paletteScale.domain() as unknown as number[];
    const paletteBounds = [paletteDomain[0], paletteDomain[paletteDomain.length - 1]] as const;
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

  #getRasterValue(color: Uint8Array): number {
    const {paletteBounds} = this.state;

    return paletteBounds[0] + color[0] / 255 * (paletteBounds[1] - paletteBounds[0]);
  }

  #getRasterDirection(color: Uint8Array): number {
    const {imageType} = ensureDefaultProps(this.props, defaultProps);
    if (imageType === ImageType.VECTOR) {
      return color[1] / 255 * 360;
    } else {
      return NaN;
    }
  }

  getPickingInfo(params: GetPickingInfoParams): PickingInfo {
    const info: PickingInfo & {raster?: RasterPickingInfo} = params.info;
    const {imageType} = ensureDefaultProps(this.props, defaultProps);
    if (!info.color) {
      return info;
    }


    let rasterPickingInfo: RasterPickingInfo;
    const value = this.#getRasterValue(info.color);
    if (imageType === ImageType.VECTOR) {
      const direction = this.#getRasterDirection(info.color);
      rasterPickingInfo = { value, direction };
    } else {
      rasterPickingInfo = { value };
    }
    info.raster = rasterPickingInfo;

    return info;
  }
}