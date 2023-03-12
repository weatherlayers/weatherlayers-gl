import type {Color, DefaultProps, UpdateParameters, LayerContext} from '@deck.gl/core/typed';
import {LineLayer, BitmapBoundingBox} from '@deck.gl/layers/typed';
import type {LineLayerProps} from '@deck.gl/layers/typed';
import {isWebGL2, Buffer, Transform} from '@luma.gl/core';
import type {Texture2D} from '@luma.gl/core';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR} from '../../../_utils/props.js';
import {ImageInterpolation} from '../../../_utils/image-interpolation.js';
import {ImageType} from '../../../_utils/image-type.js';
import type {ImageUnscale} from '../../../_utils/image-unscale.js';
import {isViewportGlobe, isViewportMercator, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds} from '../../../_utils/viewport.js';
import {sourceCode as updateVs, tokens as updateVsTokens} from './particle-line-layer-update.vs.glsl';

const FPS = 30;
const SOURCE_POSITION = 'sourcePosition';
const TARGET_POSITION = 'targetPosition';

export type ParticleLineLayerProps<DataT> = LineLayerProps<DataT> & {
  imageTexture: Texture2D | null;
  imageTexture2: Texture2D | null;
  imageSmoothing: number;
  imageInterpolation: ImageInterpolation;
  imageWeight: number;
  imageType: ImageType;
  imageUnscale: ImageUnscale;
  bounds: BitmapBoundingBox;

  numParticles: number;
  maxAge: number;
  speedFactor: number;

  width: number;
  color: Color;
  animate: boolean;
};

const defaultProps = {
  imageTexture: {type: 'object', value: null},
  imageTexture2: {type: 'object', value: null},
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'object', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'object', value: ImageType.VECTOR},
  imageUnscale: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  numParticles: {type: 'number', min: 1, max: 1000000, value: 5000},
  maxAge: {type: 'number', min: 1, max: 255, value: 10},
  speedFactor: {type: 'number', min: 0, max: 50, value: 1},

  width: {type: 'number', value: DEFAULT_LINE_WIDTH},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},
  animate: true,

  wrapLongitude: true,
} satisfies DefaultProps<ParticleLineLayerProps<any>>;

export class ParticleLineLayer<DataT = any> extends LineLayer<DataT, ParticleLineLayerProps<DataT>> {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'vs:#decl': (parentShaders.inject?.['vs:#decl'] || '') + `
          varying float drop;
          const vec2 DROP_POSITION = vec2(0);
        `,
        'vs:#main-start': (parentShaders.inject?.['vs:#main-start'] || '') + `
          drop = float(instanceSourcePositions.xy == DROP_POSITION || instanceTargetPositions.xy == DROP_POSITION);
        `,
        'fs:#decl': (parentShaders.inject?.['fs:#decl'] || '') + `
          varying float drop;
        `,
        'fs:#main-start': (parentShaders.inject?.['fs:#main-start'] || '') + `
          if (drop > 0.5) discard;
        `,
      },
    };
  }

  initializeState() {
    super.initializeState();

    this._setupTransformFeedback();

    const attributeManager = this.getAttributeManager()!;
    attributeManager.remove(['instanceSourcePositions', 'instanceTargetPositions', 'instanceColors', 'instanceWidths']);
  }

  updateState(params: UpdateParameters<this>) {
    const {imageType, numParticles, maxAge, color, width} = params.props;

    super.updateState(params);

    if (imageType !== ImageType.VECTOR || !numParticles || !maxAge || !width) {
      this._deleteTransformFeedback();
      return;
    }

    if (
      imageType !== params.oldProps.imageType ||
      numParticles !== params.oldProps.numParticles ||
      maxAge !== params.oldProps.maxAge ||
      color[0] !== params.oldProps.color[0] ||
      color[1] !== params.oldProps.color[1] ||
      color[2] !== params.oldProps.color[2] ||
      color[3] !== params.oldProps.color[3] ||
      width !== params.oldProps.width
    ) {
      this._setupTransformFeedback();
    }
  }

  finalizeState(context: LayerContext) {
    this._deleteTransformFeedback();

    super.finalizeState(context);
  }

  draw(opts: any) {
    const {initialized} = this.state;
    if (!initialized) {
      return;
    }

    const {animate} = this.props;
    const {sourcePositions, targetPositions, sourcePositions64Low, targetPositions64Low, colors, widths, model} = this.state;

    model.setAttributes({
      instanceSourcePositions: sourcePositions,
      instanceTargetPositions: targetPositions,
      instanceSourcePositions64Low: sourcePositions64Low,
      instanceTargetPositions64Low: targetPositions64Low,
      instanceColors: colors,
      instanceWidths: widths,
    });

    super.draw(opts);

    if (animate) {
      this.requestStep();
    }
  }

  _setupTransformFeedback() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      throw new Error('WebGL 2 is required');
    }

    const {initialized} = this.state;
    if (initialized) {
      this._deleteTransformFeedback();
    }

    const {numParticles, maxAge, color, width} = this.props;

    // sourcePositions/targetPositions buffer layout:
    // |          age0             |          age1             |          age2             |...|          age(N-1)         |
    // |pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|...|pos0,pos1,pos2,...,pos(N-1)|
    const numInstances = numParticles * maxAge;
    const numAgedInstances = numParticles * (maxAge - 1);
    const sourcePositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const targetPositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const sourcePositions64Low = new Float32Array([0, 0, 0]); // constant attribute
    const targetPositions64Low = new Float32Array([0, 0, 0]); // constant attribute
    const colors = new Buffer(gl, new Float32Array(new Array(numInstances).fill(undefined).map((_, i) => {
      const age = Math.floor(i / numParticles);
      return [color[0], color[1], color[2], (color[3] ?? 255) * (1 - age / maxAge)].map(d => d / 255);
    }).flat()));
    const widths = new Float32Array([width]); // constant attribute

    // setup transform feedback for particles age0
    const transform = new Transform(gl, {
      sourceBuffers: {
        [SOURCE_POSITION]: sourcePositions,
      },
      feedbackBuffers: {
        [TARGET_POSITION]: targetPositions,
      },
      feedbackMap: {
        [SOURCE_POSITION]: TARGET_POSITION,
      },
      vs: updateVs,
      elementCount: numParticles,
    });

    this.setState({
      initialized: true,
      numInstances,
      numAgedInstances,
      sourcePositions,
      targetPositions,
      sourcePositions64Low,
      targetPositions64Low,
      colors,
      widths,
      transform,
      previousViewportZoom: 0,
    });
  }

  _runTransformFeedback() {
    const {initialized} = this.state;
    if (!initialized) {
      return;
    }

    const {viewport, timeline} = this.context;
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, bounds, numParticles, maxAge, speedFactor} = this.props;
    const {numAgedInstances, transform, previousViewportZoom, previousTime} = this.state;
    const time = timeline.getTime();
    if (!imageTexture || time === previousTime) {
      return;
    }

    // viewport
    const viewportGlobe = isViewportGlobe(viewport);
    const viewportGlobeCenter = isViewportGlobe(viewport) ? getViewportGlobeCenter(viewport) : null;
    const viewportGlobeRadius = isViewportGlobe(viewport) ? getViewportGlobeRadius(viewport) : null;
    const viewportBounds = isViewportMercator(viewport) ? getViewportBounds(viewport) : null;
    const viewportZoomChangeFactor = 2 ** ((previousViewportZoom - viewport.zoom) * 4);

    // speed factor for current zoom level
    const currentSpeedFactor = speedFactor / 2 ** (viewport.zoom + 7);

    // update particles age0
    const uniforms = {
      [updateVsTokens.viewportGlobe]: viewportGlobe,
      [updateVsTokens.viewportGlobeCenter]: viewportGlobeCenter || [0, 0],
      [updateVsTokens.viewportGlobeRadius]: viewportGlobeRadius || 0,
      [updateVsTokens.viewportBounds]: viewportBounds || [0, 0, 0, 0],
      [updateVsTokens.viewportZoomChangeFactor]: viewportZoomChangeFactor || 0,

      [updateVsTokens.imageTexture]: imageTexture,
      [updateVsTokens.imageTexture2]: imageTexture2 !== imageTexture ? imageTexture2 : null,
      [updateVsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
      [updateVsTokens.imageSmoothing]: imageSmoothing,
      [updateVsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
      [updateVsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
      [updateVsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
      [updateVsTokens.imageUnscale]: imageUnscale || [0, 0],
      [updateVsTokens.bounds]: bounds,
      [updateVsTokens.numParticles]: numParticles,
      [updateVsTokens.maxAge]: maxAge,
      [updateVsTokens.speedFactor]: currentSpeedFactor,

      [updateVsTokens.time]: time,
      [updateVsTokens.seed]: Math.random(),
    };
    transform.run({uniforms});

    // update particles age1-age(N-1)
    // copy age0-age(N-2) sourcePositions to age1-age(N-1) targetPositions
    const sourcePositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].sourceBuffers[SOURCE_POSITION];
    const targetPositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].feedbackBuffers[TARGET_POSITION];
    targetPositions.copyData({
      sourceBuffer: sourcePositions,
      readOffset: 0,
      writeOffset: numParticles * 4 * 3,
      size: numAgedInstances * 4 * 3,
    });

    transform.swap();

    // const {sourcePositions, targetPositions} = this.state;
    // console.log(uniforms, sourcePositions.getData().slice(0, 6), targetPositions.getData().slice(0, 6));

    this.state.previousViewportZoom = viewport.zoom;
    this.state.previousTime = time;
  }

  _resetTransformFeedback() {
    const {initialized} = this.state;
    if (!initialized) {
      return;
    }

    const {numInstances, sourcePositions, targetPositions} = this.state;

    sourcePositions.subData({data: new Float32Array(numInstances * 3)});
    targetPositions.subData({data: new Float32Array(numInstances * 3)});
  }

  _deleteTransformFeedback() {
    const {initialized} = this.state;
    if (!initialized) {
      return;
    }

    const {sourcePositions, targetPositions, colors, transform} = this.state;

    sourcePositions.delete();
    targetPositions.delete();
    colors.delete();
    transform.delete();

    this.setState({
      initialized: false,
      sourcePositions: undefined,
      targetPositions: undefined,
      sourcePositions64Low: undefined,
      targetPositions64Low: undefined,
      colors: undefined,
      widths: undefined,
      transform: undefined,
    });
  }

  requestStep() {
    const {stepRequested} = this.state;
    if (stepRequested) {
      return;
    }

    this.state.stepRequested = true;
    setTimeout(() => {
      this.step();
      this.state.stepRequested = false;
    }, 1000 / FPS);
  }

  step() {
    this._runTransformFeedback();

    this.setNeedsRedraw();
  }

  clear() {
    this._resetTransformFeedback();

    this.setNeedsRedraw();
  }
}

ParticleLineLayer.layerName = 'ParticleLineLayer';
ParticleLineLayer.defaultProps = defaultProps;