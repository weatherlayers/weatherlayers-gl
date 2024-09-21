import type { Color, LayerProps, DefaultProps, UpdateParameters } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import type { BitmapLayerProps, BitmapBoundingBox } from '@deck.gl/layers';
import type { Texture } from '@luma.gl/core';
import { DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, ensureDefaultProps } from '../../_utils/props.js';
import { ImageInterpolation } from '../../_utils/image-interpolation.js';
import { ImageType } from '../../../client/_utils/image-type.js';
import type { ImageUnscale } from '../../../client/_utils/image-unscale.js';
import { isViewportInZoomBounds } from '../../_utils/viewport.js';
import { parsePalette } from '../../../client/_utils/palette.js';
import type { Palette } from '../../../client/_utils/palette.js';
import { createPaletteTexture } from '../../_utils/palette-texture.js';
import { createEmptyTextureCached } from '../../_utils/texture.js';
import { deckColorToGl } from '../../_utils/color.js';
import { bitmapUniforms } from '../../shaderlib/bitmap/bitmap.js';
import type { BitmapProps } from '../../shaderlib/bitmap/bitmap.js';
import { rasterUniforms } from '../../shaderlib/raster/raster.js';
import type { RasterProps } from '../../shaderlib/raster/raster.js';
import { paletteUniforms } from '../../shaderlib/palette/palette.js';
import type { PaletteProps } from '../../shaderlib/palette/palette.js';
import { contourUniforms } from './contour-bitmap-layer-uniforms.js';
import type { ContourProps } from './contour-bitmap-layer-uniforms.js';
import { sourceCode as fs/*, tokens as fsTokens*/ } from './contour-bitmap-layer.fs.glsl';

type _ContourBitmapLayerProps = BitmapLayerProps & {
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
  color: Color | null;

  interval: number;
  majorInterval: number;
  width: number;
}

export type ContourBitmapLayerProps = _ContourBitmapLayerProps & LayerProps;

const defaultProps: DefaultProps<ContourBitmapLayerProps> = {
  imageTexture: { type: 'object', value: null },
  imageTexture2: { type: 'object', value: null },
  imageSmoothing: { type: 'number', value: 0 },
  imageInterpolation: { type: 'object', value: ImageInterpolation.CUBIC },
  imageWeight: { type: 'number', value: 0 },
  imageType: { type: 'object', value: ImageType.SCALAR },
  imageUnscale: { type: 'object', value: null },
  imageMinValue: { type: 'object', value: null },
  imageMaxValue: { type: 'object', value: null },
  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },
  minZoom: { type: 'object', value: null },
  maxZoom: { type: 'object', value: 10 }, // drop rendering artifacts in high zoom levels due to a low precision

  palette: { type: 'object', value: null },
  color: { type: 'color', value: DEFAULT_LINE_COLOR },

  interval: { type: 'number', value: 0 },
  majorInterval: { type: 'number', value: 0 },
  width: { type: 'number', value: DEFAULT_LINE_WIDTH },
};

export class ContourBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<ExtraPropsT & Required<_ContourBitmapLayerProps>> {
  static layerName = 'ContourBitmapLayer';
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
      modules: [...parentShaders.modules, bitmapUniforms, rasterUniforms, paletteUniforms, contourUniforms],
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
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom, color, interval, majorInterval, width } = ensureDefaultProps(this.props, defaultProps);
    const { paletteTexture, paletteBounds } = this.state;
    if (!imageTexture) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.shaderInputs.setProps({
        // TODO: add back [fsTokens.xxx]
        bitmap: {
          ...super._getCoordinateUniforms() as {bounds: [number, number, number, number], coordinateConversion: number},
          transparentColor: this.props.transparentColor.map(x => x / 255) as [number, number, number, number],
        } satisfies BitmapProps,
        raster: {
          imageTexture: imageTexture ?? createEmptyTextureCached(device),
          imageTexture2: (imageTexture2 !== imageTexture ? imageTexture2 : null) ?? createEmptyTextureCached(device),
          imageResolution: [imageTexture.width, imageTexture.height],
          imageSmoothing: imageSmoothing ?? 0,
          imageInterpolation: Object.values(ImageInterpolation).indexOf(imageInterpolation),
          imageWeight: imageTexture2 !== imageTexture ? imageWeight : 0,
          imageType: Object.values(ImageType).indexOf(imageType),
          imageUnscale: imageUnscale ?? [0, 0],
          imageMinValue: imageMinValue ?? Number.MIN_SAFE_INTEGER,
          imageMaxValue: imageMaxValue ?? Number.MAX_SAFE_INTEGER,
        } satisfies RasterProps,
        palette: {
          paletteTexture: paletteTexture ?? createEmptyTextureCached(device),
          paletteBounds: paletteBounds ?? [0, 0],
          paletteColor: color ? deckColorToGl(color) : [0, 0, 0, 0],
        } satisfies PaletteProps,
        contour: {
          interval: interval,
          majorInterval: majorInterval,
          width: width,
        } satisfies ContourProps,
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
}