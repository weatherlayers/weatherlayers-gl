import {BitmapLayer} from '@deck.gl/layers';
import {code as fsDecl, tokens as fsDeclTokens} from './contour-gpu-bitmap-layer-fs-decl.glsl';
import {code as fsMainEnd} from './contour-gpu-bitmap-layer-fs-main-end.glsl';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR} from '../../../_utils/props';
import {ImageType} from '../../../_utils/image-type';

const defaultProps = {
  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageInterpolate: {type: 'boolean', value: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  interval: {type: 'number', value: null}, // TODO: make required after step is removed
  step: {type: 'number', value: null}, // deprecated in 2022.6.0, use interval instead, TODO: remove
  width: {type: 'number', value: DEFAULT_LINE_WIDTH},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},

  rasterOpacity: {type: 'number', min: 0, max: 1, value: 1},
};

export class ContourGpuBitmapLayer extends BitmapLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: ['#version 300 es', parentShaders.vs].join('\n'),
      fs: ['#version 300 es', parentShaders.fs].join('\n'),
      inject: {
        ...parentShaders.inject,
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-end': [parentShaders.inject?.['fs:#main-end'], fsMainEnd].join('\n'),
      },
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageInterpolate, imageWeight, imageType, imageUnscale, color, width, rasterOpacity} = this.props;
    const interval = this.props.interval || this.props.step; // TODO: remove after step is removed

    if (!imageTexture) {
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
        [fsDeclTokens.interval]: interval,
        [fsDeclTokens.color]: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        [fsDeclTokens.width]: width,
        [fsDeclTokens.rasterOpacity]: rasterOpacity,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = undefined;
    }
  }
}

ContourGpuBitmapLayer.layerName = 'ContourGpuBitmapLayer';
ContourGpuBitmapLayer.defaultProps = defaultProps;