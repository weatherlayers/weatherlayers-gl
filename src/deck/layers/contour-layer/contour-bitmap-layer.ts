import type { Color, LayerProps, DefaultProps, UpdateParameters } from '@deck.gl/core/typed';
import { BitmapLayer } from '@deck.gl/layers/typed';
import type { BitmapLayerProps, BitmapBoundingBox } from '@deck.gl/layers/typed';
import { FEATURES, isWebGL2, hasFeatures } from '@luma.gl/core';
import type { Texture2D } from '@luma.gl/core';
import { sourceCode as fs, tokens as fsTokens } from './contour-bitmap-layer.fs.glsl';
import { DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, ensureDefaultProps } from '../../../_utils/props.js';
import { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';
import { isViewportInZoomBounds } from '../../../_utils/viewport.js';
import { parsePalette, createPaletteTexture, type Palette } from '../../../_utils/palette.js';
import { deckColorToGl } from '../../../_utils/color.js';

type _ContourBitmapLayerProps = BitmapLayerProps & {
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

  interval: number;
  majorInterval: number;
  width: number;
  color: Color | null;
  palette: Palette | null;
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

  interval: { type: 'number', value: 0 },
  majorInterval: { type: 'number', value: 0 },
  width: { type: 'number', value: DEFAULT_LINE_WIDTH },
  color: { type: 'color', value: DEFAULT_LINE_COLOR },
  palette: { type: 'object', value: null },
};

export class ContourBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<ExtraPropsT & Required<_ContourBitmapLayerProps>> {
  static layerName = 'ContourBitmapLayer';
  static defaultProps = defaultProps;

  getShaders(): any {
    const { gl } = this.context;
    if (!hasFeatures(gl, FEATURES.GLSL_DERIVATIVES)) {
      throw new Error('Derivatives are required');
    }

    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: isWebGL2(gl) ? `#version 300 es\n${parentShaders.vs}` : parentShaders.vs,
      fs: isWebGL2(gl) ? `#version 300 es\n${fs}` : fs,
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
    const { viewport } = this.context;
    const { model } = this.state;
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, minZoom, maxZoom, interval, majorInterval, color, width } = ensureDefaultProps(this.props, defaultProps);
    const { paletteTexture, paletteBounds } = this.state;
    if (!imageTexture) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.setUniforms({
        [fsTokens.imageTexture]: imageTexture,
        [fsTokens.imageTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
        [fsTokens.imageSmoothing]: imageSmoothing,
        [fsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
        [fsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsTokens.imageValueBounds]: [imageMinValue ?? NaN, imageMaxValue ?? NaN],

        [fsTokens.interval]: interval,
        [fsTokens.majorInterval]: majorInterval,
        [fsTokens.width]: width,
        [fsTokens.color]: color ? deckColorToGl(color) : [0, 0, 0, 0],
        [fsTokens.paletteTexture]: paletteTexture,
        [fsTokens.paletteBounds]: paletteBounds || [0, 0],
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
}