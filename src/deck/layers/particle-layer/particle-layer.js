/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {LineLayer} from '@deck.gl/layers';
import {Buffer, Transform} from '@luma.gl/core';
import {isWebGL2} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {code as vsDecl} from './particle-layer-vs-decl.glsl';
import {code as vsMainStart} from './particle-layer-vs-main-start.glsl';
import {code as fsDecl} from './particle-layer-fs-decl.glsl';
import {code as fsMainStart} from './particle-layer-fs-main-start.glsl';
import {code as updateTransformVs, tokens as updateTransformVsTokens} from './particle-layer-update-transform.vs.glsl';
import {distance} from '../../../_utils/geodesy';
import {wrapBounds} from '../../../_utils/bounds';

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_WRAP_S]: GL.REPEAT,
};

const DEFAULT_COLOR = [255, 255, 255, 255];
const FPS = 30;

const defaultProps = {
  ...LineLayer.defaultProps,

  image: {type: 'image', value: null, required: true},
  image2: {type: 'image', value: null},
  imageWeight: {type: 'number', value: 0},
  imageBounds: {type: 'array', value: null, required: true},

  numParticles: {type: 'number', min: 1, max: 1000000, value: 5000},
  maxAge: {type: 'number', min: 1, max: 255, value: 100},
  speedFactor: {type: 'number', min: 0, max: 1, value: 1},

  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},
  animate: true,

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  textureParameters: DEFAULT_TEXTURE_PARAMETERS,
};

export class ParticleLayer extends LineLayer {
  getShaders() {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'vs:#decl': [parentShaders.inject?.['vs:#decl'], vsDecl].join('\n'),
        'vs:#main-start': [parentShaders.inject?.['vs:#main-start'], vsMainStart].join('\n'),
        'fs:#decl': [parentShaders.inject?.['fs:#decl'], fsDecl].join('\n'),
        'fs:#main-start': [parentShaders.inject?.['fs:#main-start'], fsMainStart].join('\n'),
      },
    };
  }

  initializeState() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      throw new Error('WebGL 2 is required');
    }

    super.initializeState({});

    this._setupTransformFeedback();

    const attributeManager = this.getAttributeManager();
    attributeManager.remove(['instanceSourcePositions', 'instanceTargetPositions', 'instanceColors', 'instanceWidths']);
  }

  updateState({props, oldProps, changeFlags}) {
    const {numParticles, maxAge, color, width} = props;

    super.updateState({props, oldProps, changeFlags});

    if (
      numParticles !== oldProps.numParticles ||
      maxAge !== oldProps.maxAge ||
      color[0] !== oldProps.color[0] ||
      color[1] !== oldProps.color[1] ||
      color[2] !== oldProps.color[2] ||
      color[3] !== oldProps.color[3] ||
      width !== oldProps.width
    ) {
      this._setupTransformFeedback();
    }
  }

  finalizeState() {
    this._deleteTransformFeedback();

    super.finalizeState();
  }

  draw({uniforms}) {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      return;
    }

    const {animate} = this.props;
    const {sourcePositions, targetPositions, colors, widths, model} = this.state;

    model.setAttributes({
      instanceSourcePositions: sourcePositions,
      instanceTargetPositions: targetPositions,
      instanceColors: colors,
      instanceWidths: widths,
    });

    super.draw({uniforms});

    if (animate) {
      this.requestStep();
    }
  }

  _setupTransformFeedback() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      return;
    }

    const {numParticles, maxAge, color, width} = this.props;
    const {initialized} = this.state;
    if (initialized) {
      this._deleteTransformFeedback();
    }

    // sourcePositions/targetPositions buffer layout:
    // |          age0             |          age1             |          age2             |...|          age(N-1)         |
    // |pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|...|pos0,pos1,pos2,...,pos(N-1)|
    const numInstances = numParticles * maxAge;
    const numAgedInstances = numParticles * (maxAge - 1);
    const sourcePositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const targetPositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const colors = new Buffer(gl, new Float32Array(new Array(numInstances).fill(undefined).map((_, i) => {
      const age = Math.floor(i / numParticles);
      return [color[0], color[1], color[2], (color[3] ?? 255) * (1 - age / maxAge)].map(d => d / 255);
    }).flat()));
    const widths = new Buffer(gl, new Float32Array(new Array(numInstances).fill(width)));

    // setup transform feedback for particles age0
    const transform = new Transform(gl, {
      sourceBuffers: {
        [updateTransformVsTokens.sourcePosition]: sourcePositions,
      },
      feedbackBuffers: {
        [updateTransformVsTokens.targetPosition]: targetPositions,
      },
      feedbackMap: {
        [updateTransformVsTokens.sourcePosition]: updateTransformVsTokens.targetPosition,
      },
      vs: updateTransformVs,
      elementCount: numParticles,
    });

    this.setState({
      initialized: true,
      numInstances,
      numAgedInstances,
      sourcePositions,
      targetPositions,
      colors,
      widths,
      transform,
      previousViewportZoom: 0,
    });
  }

  _runTransformFeedback() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      return;
    }

    const {viewport, timeline} = this.context;
    const {image, image2, imageWeight, imageBounds, bounds, numParticles, maxAge, speedFactor} = this.props;
    const {numAgedInstances, transform, previousViewportZoom, previousTime} = this.state;
    const isGlobeViewport = !!viewport.resolution;
    const time = timeline.getTime();

    if (!image || time === previousTime) {
      return;
    }

    const imageUnscale = image.type !== GL.FLOAT ? 1 : 0;

    // viewport
    const viewportSphere = isGlobeViewport ? 1 : 0;
    const viewportSphereCenter = [viewport.longitude, viewport.latitude];
    const viewportSphereRadius = Math.max(
      distance(viewportSphereCenter, viewport.unproject([0, 0])),
      distance(viewportSphereCenter, viewport.unproject([viewport.width / 2, 0])),
      distance(viewportSphereCenter, viewport.unproject([0, viewport.height / 2])),
    );
    const viewportBounds = wrapBounds(viewport.getBounds());
    const viewportZoomChangeFactor = 2 ** ((previousViewportZoom - viewport.zoom) * 4);

    // speed factor for current zoom level
    const currentSpeedFactor = speedFactor / 2 ** (viewport.zoom + 7);

    // update particles age0
    const uniforms = {
      [updateTransformVsTokens.viewportSphere]: viewportSphere,
      [updateTransformVsTokens.viewportSphereCenter]: viewportSphereCenter,
      [updateTransformVsTokens.viewportSphereRadius]: viewportSphereRadius,
      [updateTransformVsTokens.viewportBounds]: viewportBounds,
      [updateTransformVsTokens.viewportZoomChangeFactor]: viewportZoomChangeFactor,

      [updateTransformVsTokens.bitmapTexture]: image,
      [updateTransformVsTokens.bitmapTexture2]: image2,
      [updateTransformVsTokens.imageWeight]: image2 ? imageWeight : 0,
      [updateTransformVsTokens.imageUnscale]: imageUnscale,
      [updateTransformVsTokens.imageBounds]: imageBounds,
      [updateTransformVsTokens.bounds]: bounds,
      [updateTransformVsTokens.numParticles]: numParticles,
      [updateTransformVsTokens.maxAge]: maxAge,
      [updateTransformVsTokens.speedFactor]: currentSpeedFactor,

      [updateTransformVsTokens.time]: time,
      [updateTransformVsTokens.seed]: Math.random(),
    };
    transform.run({uniforms});

    // update particles age1-age(N-1)
    // copy age0-age(N-2) sourcePositions to age1-age(N-1) targetPositions
    const sourcePositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].sourceBuffers[updateTransformVsTokens.sourcePosition];
    const targetPositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].feedbackBuffers[updateTransformVsTokens.targetPosition];
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
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      return;
    }

    const {numInstances, sourcePositions, targetPositions} = this.state;

    sourcePositions.subData({data: new Float32Array(numInstances * 3)});
    targetPositions.subData({data: new Float32Array(numInstances * 3)});
  }

  _deleteTransformFeedback() {
    const {gl} = this.context;
    if (!isWebGL2(gl)) {
      return;
    }

    const {initialized, sourcePositions, targetPositions, colors, widths, transform} = this.state;
    if (!initialized) {
      return;
    }

    sourcePositions.delete();
    targetPositions.delete();
    colors.delete();
    widths.delete();
    transform.delete();

    this.setState({
      initialized: false,
      sourcePositions: undefined,
      targetPositions: undefined,
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

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;
