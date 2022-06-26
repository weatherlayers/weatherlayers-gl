import {isWebGL2} from '@luma.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {sourceCode as fs, tokens as fsTokens} from './contour-gpu-bitmap-layer.fs.glsl';
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
};

export class ContourGpuBitmapLayer extends BitmapLayer {
  getShaders() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      throw new Error('WebGL 2 is required');
    }
    
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: ['#version 300 es', parentShaders.vs].join('\n'),
      fs: fs,
    };
  }

  draw(opts) {
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageInterpolate, imageWeight, imageType, imageUnscale, color, width} = this.props;
    const interval = this.props.interval || this.props.step; // TODO: remove after step is removed

    if (!imageTexture) {
      return;
    }

    if (model) {
      model.setUniforms({
        [fsTokens.imageTexture]: imageTexture,
        [fsTokens.imageTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
        [fsTokens.imageTexelSize]: [1 / imageTexture.width, 1 / imageTexture.height],
        [fsTokens.imageInterpolate]: imageInterpolate,
        [fsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
        [fsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
        [fsTokens.imageUnscale]: imageUnscale || [0, 0],
        [fsTokens.interval]: interval,
        [fsTokens.color]: [color[0], color[1], color[2], (color[3] ?? 255)].map(d => d / 255),
        [fsTokens.width]: width,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = undefined;
    }
  }
}

ContourGpuBitmapLayer.layerName = 'ContourGpuBitmapLayer';
ContourGpuBitmapLayer.defaultProps = defaultProps;