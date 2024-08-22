import type { LayerProps, DefaultProps, UpdateParameters, GetPickingInfoParams } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import type { BitmapLayerProps, BitmapBoundingBox, BitmapLayerPickingInfo } from '@deck.gl/layers';
import type { Texture } from '@luma.gl/core';
import { ensureDefaultProps } from '../../_utils/props.js';
import { ImageInterpolation } from '../../_utils/image-interpolation.js';
import { ImageType } from '../../../client/_utils/image-type.js';
import type { ImageUnscale } from '../../../client/_utils/image-unscale.js';
import { isViewportInZoomBounds } from '../../_utils/viewport.js';
import type { RasterPointProperties } from '../../_utils/raster-data.js';
import { parsePalette } from '../../../client/_utils/palette.js';
import type { Palette } from '../../../client/_utils/palette.js';
import { createPaletteTexture } from '../../_utils/palette-texture.js';
import { createEmptyTextureCached } from '../../_utils/texture.js';
import { sourceCode as fs, tokens as fsTokens } from './raster-bitmap-layer.fs.glsl';

type _RasterBitmapLayerProps = BitmapLayerProps & {
  imageTexture: Texture | null;
  imageTexture2: Texture | null;
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

  declare state: BitmapLayer['state'] & {
    paletteTexture?: Texture;
    paletteBounds?: [number, number];
  };

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      fs,
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
    const { device, viewport } = this.context;
    const { model } = this.state;
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom } = ensureDefaultProps(this.props, defaultProps);
    const { paletteTexture, paletteBounds } = this.state;
    if (!imageTexture) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.setBindings({
        [fsTokens.imageTexture]: imageTexture ?? createEmptyTextureCached(device),
        [fsTokens.imageTexture2]: (imageTexture2 !== imageTexture ? imageTexture2 : null) ?? createEmptyTextureCached(device),

        [fsTokens.paletteTexture]: paletteTexture ?? createEmptyTextureCached(device),
      });
      model.setUniforms({
        [fsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
        [fsTokens.imageSmoothing]: imageSmoothing ?? 0,
        [fsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
        [fsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsTokens.imageUnscale]: imageUnscale ?? [0, 0],
        [fsTokens.imageValueBounds]: [imageMinValue ?? Number.MIN_SAFE_INTEGER, imageMaxValue ?? Number.MAX_SAFE_INTEGER],

        [fsTokens.paletteBounds]: paletteBounds ?? [0, 0],
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }

  #updatePalette(): void {
    const { device } = this.context;
    const { palette } = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      this.setState({ paletteTexture: undefined, paletteBounds: undefined });
      return;
    }

    const paletteScale = parsePalette(palette);
    const { paletteBounds, paletteTexture } = createPaletteTexture(device, paletteScale);

    this.setState({ paletteTexture, paletteBounds });
  }

  #getRasterMagnitudeValue(color: Uint8Array, paletteBounds: [number, number]): number {
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

  getPickingInfo(params: GetPickingInfoParams): BitmapLayerPickingInfo {
    const info: BitmapLayerPickingInfo & { raster?: RasterPointProperties } = super.getPickingInfo(params);
    const { imageType } = ensureDefaultProps(this.props, defaultProps);
    const { paletteBounds } = this.state;
    if (!info.color) {
      return info;
    }

    let rasterPointProperties: RasterPointProperties;
    const value = this.#getRasterMagnitudeValue(info.color, paletteBounds ?? [0, 0]);
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