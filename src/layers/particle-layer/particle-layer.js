/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {LineLayer} from '@deck.gl/layers';
import {Buffer, Transform} from '@luma.gl/core';
import GL from '@luma.gl/constants';

import { distance } from './geodesy';
import updateTransformVs from './particle-layer-update-transform.vs.glsl';

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_WRAP_S]: GL.REPEAT,
};

const DEFAULT_COLOR = [255, 255, 255, 255];

const defaultProps = {
  ...LineLayer.defaultProps,

  image: {type: 'image', value: null, async: true},
  image2: {type: 'image', value: null, async: true},
  imageWeight: {type: 'number', value: 0},
  imageBounds: {type: 'array', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
  textureParameters: DEFAULT_TEXTURE_PARAMETERS,

  numParticles: {type: 'number', min: 1, max: 1000000, value: 5000},
  maxAge: {type: 'number', min: 1, max: 255, value: 100},
  speedFactor: {type: 'number', min: 0, max: 1, value: 1},
  color: {type: 'color', value: DEFAULT_COLOR},
  width: {type: 'number', value: 1},
  animate: true,
};

export class ParticleLayer extends LineLayer {
  getShaders() {
    return {
      ...super.getShaders(),
      inject: {
        'vs:#decl': `
          varying float drop;
          const vec2 DROP_POSITION = vec2(0);
        `,
        'vs:#main-start': `
          drop = float(instanceSourcePositions.xy == DROP_POSITION || instanceTargetPositions.xy == DROP_POSITION);
        `,
        'fs:#decl': `
          varying float drop;
        `,
        'fs:#main-start': `
          if (drop > 0.5) discard;
        `,
      },
    };
  }

  initializeState() {
    super.initializeState({});

    this._setupTransformFeedback();

    const attributeManager = this.getAttributeManager();
    attributeManager.remove(['instanceSourcePositions', 'instanceTargetPositions', 'instanceColors', 'instanceWidths']);
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});

    if (
      props.numParticles !== oldProps.numParticles ||
      props.maxAge !== oldProps.maxAge ||
      props.color !== oldProps.color ||
      props.width !== oldProps.width
    ) {
      this._setupTransformFeedback();
    }
  }

  finalizeState() {
    this._deleteTransformFeedback();

    super.finalizeState();
  }

  draw({uniforms}) {
    const {animate} = this.props;
    const {sourcePositions, targetPositions, colors, widths, model} = this.state;

    if (animate) {
      this._runTransformFeedback();
    }

    model.setAttributes({
      instanceSourcePositions: sourcePositions,
      instanceTargetPositions: targetPositions,
      instanceColors: colors,
      instanceWidths: widths,
    });

    super.draw({uniforms});
  }

  _setupTransformFeedback() {
    const {gl} = this.context;
    const {numParticles, maxAge, color, width} = this.props;
    const {initialized} = this.state;
    
    if (initialized) {
      this._deleteTransformFeedback();
    }

    // sourcePositions/targetPositions buffer layout:
    // |          age0         |          age1         |          age2         |...|          ageN         |
    // |pos1,pos2,pos3,...,posN|pos1,pos2,pos3,...,posN|pos1,pos2,pos3,...,posN|...|pos1,pos2,pos3,...,posN|
    const numInstances = numParticles * maxAge;
    const numAgedInstances = numParticles * (maxAge - 1);
    const sourcePositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const targetPositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const colors = new Buffer(gl, new Float32Array(new Array(numInstances).fill(undefined).map((_, i) => {
      const age = Math.floor(i / numParticles);
      return [color[0], color[1], color[2], (color[3] ?? 255) * (1 - age / maxAge)].map(d => d / 255);
    }).flat()));
    const widths = new Buffer(gl, new Float32Array(new Array(numInstances).fill(width)));

    const transform = new Transform(gl, {
      sourceBuffers: {
        sourcePosition: sourcePositions,
      },
      feedbackBuffers: {
        targetPosition: targetPositions,
      },
      feedbackMap: {
        sourcePosition: 'targetPosition',
      },
      vs: updateTransformVs,
      elementCount: numInstances,
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
    });
  }

  _runTransformFeedback() {
    const {gl, viewport, timeline} = this.context;
    const {image, image2, imageWeight, imageBounds, bounds, numParticles, speedFactor, maxAge} = this.props;
    const {numAgedInstances, transform} = this.state;

    if (!image) {
      return;
    }

    const imageUnscale = image.type !== GL.FLOAT ? 1 : 0;

    const viewportSphere = viewport.resolution ? 1 : 0; // globe
    const viewportSphereCenter = [viewport.longitude, viewport.latitude];
    const viewportSphereRadius = Math.max(
      distance(viewportSphereCenter, viewport.unproject([0, 0])),
      distance(viewportSphereCenter, viewport.unproject([viewport.width / 2, 0])),
      distance(viewportSphereCenter, viewport.unproject([0, viewport.height / 2])),
    );
    const viewportBounds = viewport.getBounds();
    // viewportBounds[0] = Math.max(viewportBounds[0], -180);
    viewportBounds[1] = Math.max(viewportBounds[1], -85.051129);
    // viewportBounds[2] = Math.min(viewportBounds[2], 180);
    viewportBounds[3] = Math.min(viewportBounds[3], 85.051129);

    // speed factor for current zoom level
    const devicePixelRatio = gl.luma.canvasSizeInfo.devicePixelRatio;
    const viewportSpeedFactor = speedFactor * devicePixelRatio / 2 ** viewport.zoom / 128;

    // age particles
    // copy age0-age(N-2) targetPositions to age1-age(N-1) sourcePositions
    const sourcePositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].sourceBuffers.sourcePosition;
    const targetPositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].feedbackBuffers.targetPosition;
    sourcePositions.copyData({
      sourceBuffer: targetPositions,
      readOffset: 0,
      writeOffset: numParticles * 4 * 3,
      size: numAgedInstances * 4 * 3,
    });

    // update particles
    const uniforms = {
      bitmapTexture: image,
      bitmapTexture2: image2,
      imageWeight: image2 ? imageWeight : 0,
      imageUnscale,
      imageBounds,
      bounds,
      numParticles,
      maxAge,

      viewportSphere,
      viewportSphereCenter,
      viewportSphereRadius,
      viewportBounds,
      viewportSpeedFactor,

      time: timeline.getTime(),
      seed: Math.random(),
    };
    transform.run({uniforms});
    transform.swap();

    // const {sourcePositions, targetPositions} = this.state;
    // console.log(uniforms, sourcePositions.getData().slice(0, 6), targetPositions.getData().slice(0, 6));
  }

  _deleteTransformFeedback() {
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

  step() {
    this._runTransformFeedback();

    this.setNeedsRedraw();
  }

  clear() {
    const {numInstances, sourcePositions, targetPositions} = this.state;

    sourcePositions.subData({data: new Float32Array(numInstances * 3)});
    targetPositions.subData({data: new Float32Array(numInstances * 3)});

    this.setNeedsRedraw();
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;
