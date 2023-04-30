import type { Color, LayerProps, DefaultProps } from '@deck.gl/core/typed';
import { BitmapLayer } from '@deck.gl/layers/typed';
import type { BitmapLayerProps, BitmapBoundingBox } from '@deck.gl/layers/typed';
import { FEATURES, isWebGL2, hasFeatures } from '@luma.gl/core';
import type { Texture2D } from '@luma.gl/core';
import { sourceCode as fs, tokens as fsTokens } from './contour-bitmap-layer.fs.glsl';
import { DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, ensureDefaultProps } from '../../../_utils/props.js';
import { ImageInterpolation } from '../../../_utils/image-interpolation.js';
import { ImageType } from '../../../_utils/image-type.js';
import type { ImageUnscale } from '../../../_utils/image-unscale.js';

type _ContourBitmapLayerProps = BitmapLayerProps & {
  imageTexture: Texture2D | null;
  imageTexture2: Texture2D | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: BitmapBoundingBox;

  interval: number;
  width: number;
  color: Color;
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
  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },

  interval: { type: 'number', value: 0 },
  width: { type: 'number', value: DEFAULT_LINE_WIDTH },
  color: { type: 'color', value: DEFAULT_LINE_COLOR },
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

  draw(opts: any): void {
    const { viewport } = this.context;
    const { model } = this.state;
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, interval, color, width } = ensureDefaultProps(this.props, defaultProps);
    if (!imageTexture) {
      return;
    }
    if (viewport.zoom > 10) {
      // drop artifacts in high zoom
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
        [fsTokens.interval]: interval,
        [fsTokens.color]: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        [fsTokens.width]: width,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }
}