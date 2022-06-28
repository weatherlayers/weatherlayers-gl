import {BitmapLayer} from '@deck.gl/layers';
import {FEATURES, isWebGL2, hasFeatures} from '@luma.gl/core';
import {sourceCode as fs, tokens as fsTokens} from './contour-bitmap-layer.fs.glsl';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR} from '../../../_utils/props';
import {ImageType} from '../../../_utils/image-type';

const defaultProps = {
  imageTexture: {type: 'object', value: null, required: true},
  imageTexture2: {type: 'object', value: null},
  imageInterpolate: {type: 'boolean', value: true},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'string', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},

  interval: {type: 'number', value: null, required: true},
  width: {type: 'number', value: DEFAULT_LINE_WIDTH},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},
};

export class ContourBitmapLayer extends BitmapLayer {
  getShaders() {
    const {gl} = this.context;
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

  draw(opts) {
    const {viewport} = this.context;
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageInterpolate, imageWeight, imageType, imageUnscale, interval, color, width} = this.props;

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

ContourBitmapLayer.layerName = 'ContourBitmapLayer';
ContourBitmapLayer.defaultProps = defaultProps;