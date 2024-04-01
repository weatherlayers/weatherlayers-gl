import type { LayerProps, DefaultProps, UpdateParameters, GetPickingInfoParams, PickingInfo } from '@deck.gl/core/typed';
import { BitmapLayer } from '@deck.gl/layers/typed';
import type { BitmapLayerProps, BitmapBoundingBox } from '@deck.gl/layers/typed';
import { Texture2D } from '@luma.gl/core';
import { ensureDefaultProps } from '../../../_utils/props.js';
import { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';
import { isViewportInZoomBounds } from '../../../_utils/viewport.js';
import { RasterPointProperties } from '../../../_utils/raster-data.js';
import { parsePalette, createPaletteTexture, type Palette } from '../../../_utils/palette.js';
import { createEmptyTextureCached } from '../../../_utils/texture.js';
import { sourceCode as fs, tokens as fsTokens } from './raster-bitmap-layer.fs.glsl';

type _RasterBitmapLayerProps = BitmapLayerProps & {
  imageTexture: Texture2D | null;
  imageTexture2: Texture2D | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  imageMinValue: number | null;
  imageMaxValue: number | null;
  bounds: BitmapBoundingBox;
  minZoom: number | null;
  maxZoom: number | null;

  palette: Palette | null;
};

export type RasterBitmapLayerProps = _RasterBitmapLayerProps & LayerProps;

const defaultProps: DefaultProps<RasterBitmapLayerProps> = {
  imageTexture: { type: 'object', value: null },
  imageTexture2: { type: 'object', value: null },
  imageSmoothing: { type: 'number', value: 0 },
  imageInterpolation: { type: 'object', value: ImageInterpolation.CUBIC },
  imageWeight: { type: 'number', value: 0 },
  imageType: { type: 'object', value: ImageType.SCALAR },
  imageUnscale: { type: 'array', value: null },
  imageMinValue: { type: 'object', value: null },
  imageMaxValue: { type: 'object', value: null },
  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },
  minZoom: { type: 'object', value: null },
  maxZoom: { type: 'object', value: null },

  palette: { type: 'object', value: null },
};

export class RasterBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<ExtraPropsT & Required<_RasterBitmapLayerProps>> {
  static layerName = 'RasterBitmapLayer';
  static defaultProps = defaultProps;

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: `#version 300 es\n${parentShaders.vs}`,
      fs: `#version 300 es\n${fs}`,
      prologue: false,
    };
  }

  updateState(params: UpdateParameters<this>): void {
    const { palette } = params.props;

    super.updateState(params);

    if (palette !== params.oldProps.palette) {
      this.#updatePalette();
    }
  }

  draw(opts: any): void {
    const { gl, viewport } = this.context;
    const { model } = this.state;
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom } = ensureDefaultProps(this.props, defaultProps);
    const { paletteTexture, paletteBounds } = this.state;
    if (!imageTexture || !paletteTexture) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.setUniforms({
        [fsTokens.imageTexture]: imageTexture ?? createEmptyTextureCached(gl),
        [fsTokens.imageTexture2]: (imageTexture2 !== imageTexture ? imageTexture2 : null) ?? createEmptyTextureCached(gl),
        [fsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
        [fsTokens.imageSmoothing]: imageSmoothing ?? 0,
        [fsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
        [fsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsTokens.imageUnscale]: imageUnscale ?? [0, 0],
        [fsTokens.imageValueBounds]: [imageMinValue ?? NaN, imageMaxValue ?? NaN],

        [fsTokens.paletteTexture]: paletteTexture ?? createEmptyTextureCached(gl),
        [fsTokens.paletteBounds]: paletteBounds ?? [0, 0],
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }

  #updatePalette(): void {
    const { gl } = this.context;
    const { palette } = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      this.setState({ paletteTexture: undefined, paletteBounds: undefined });
      return;
    }

    const paletteScale = parsePalette(palette);
    const { paletteBounds, paletteTexture } = createPaletteTexture(gl, paletteScale);

    this.setState({ paletteTexture, paletteBounds });
  }

  #getRasterMagnitudeValue(color: Uint8Array): number {
    const { paletteBounds } = this.state;

    return paletteBounds[0] + color[0] / 255 * (paletteBounds[1] - paletteBounds[0]);
  }

  #getRasterDirectionValue(color: Uint8Array): number {
    const { imageType } = ensureDefaultProps(this.props, defaultProps);
    if (imageType === ImageType.VECTOR) {
      return color[1] / 255 * 360;
    } else {
      return NaN;
    }
  }

  getPickingInfo(params: GetPickingInfoParams): PickingInfo {
    const info: PickingInfo & { raster?: RasterPointProperties } = params.info;
    const { imageType } = ensureDefaultProps(this.props, defaultProps);
    if (!info.color) {
      return info;
    }

    let rasterPointProperties: RasterPointProperties;
    const value = this.#getRasterMagnitudeValue(info.color);
    if (imageType === ImageType.VECTOR) {
      const direction = this.#getRasterDirectionValue(info.color);
      rasterPointProperties = { value, direction };
    } else {
      rasterPointProperties = { value };
    }
    info.raster = rasterPointProperties;

    return info;
  }
}