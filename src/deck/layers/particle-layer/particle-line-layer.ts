import type { Color, LayerProps, DefaultProps, UpdateParameters, LayerContext } from '@deck.gl/core';
import { LineLayer } from '@deck.gl/layers';
import type { LineLayerProps, BitmapBoundingBox } from '@deck.gl/layers';
import type { Buffer, Texture } from '@luma.gl/core';
import { BufferTransform } from '@luma.gl/engine';
import { DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, ensureDefaultProps } from '../../_utils/props.js';
import { ImageInterpolation } from '../../_utils/image-interpolation.js';
import { ImageType } from '../../../client/_utils/image-type.js';
import type { ImageUnscale } from '../../../client/_utils/image-unscale.js';
import { isViewportGlobe, isViewportMercator, isViewportInZoomBounds, getViewportGlobeCenter, getViewportGlobeRadius, getViewportBounds } from '../../_utils/viewport.js';
import { parsePalette } from '../../../client/_utils/palette.js';
import type { Palette } from '../../../client/_utils/palette.js';
import { createPaletteTexture } from '../../_utils/palette-texture.js';
import { deckColorToGl } from '../../_utils/color.js';
import { createEmptyTextureCached } from '../../_utils/texture.js';
import { sourceCode as updateVs, tokens as updateVsTokens } from './particle-line-layer-update.vs.glsl';

const FPS = 30;
const SOURCE_POSITION = 'sourcePosition';
const TARGET_POSITION = 'targetPosition';
const SOURCE_COLOR = 'sourceColor';
const TARGET_COLOR = 'targetColor';

type _ParticleLineLayerProps = LineLayerProps<unknown> & {
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

  numParticles: number;
  maxAge: number;
  speedFactor: number;

  width: number;
  color: Color | null;
  palette: Palette | null;
  animate: boolean;
};

export type ParticleLineLayerProps = _ParticleLineLayerProps & LayerProps;

const defaultProps: DefaultProps<ParticleLineLayerProps> = {
  imageTexture: { type: 'object', value: null },
  imageTexture2: { type: 'object', value: null },
  imageSmoothing: { type: 'number', value: 0 },
  imageInterpolation: { type: 'object', value: ImageInterpolation.CUBIC },
  imageWeight: { type: 'number', value: 0 },
  imageType: { type: 'object', value: ImageType.VECTOR },
  imageUnscale: { type: 'array', value: null },
  imageMinValue: { type: 'object', value: null },
  imageMaxValue: { type: 'object', value: null },
  bounds: { type: 'array', value: [-180, -90, 180, 90], compare: true },
  minZoom: { type: 'object', value: null },
  maxZoom: { type: 'object', value: 15 }, // drop rendering artifacts in high zoom levels due to a low precision

  numParticles: { type: 'number', min: 1, max: 1000000, value: 5000 },
  maxAge: { type: 'number', min: 1, max: 255, value: 10 },
  speedFactor: { type: 'number', min: 0, max: 50, value: 1 },

  width: { type: 'number', value: DEFAULT_LINE_WIDTH },
  color: { type: 'color', value: DEFAULT_LINE_COLOR },
  animate: true,

  wrapLongitude: true,
};

export class ParticleLineLayer<ExtraPropsT extends {} = {}> extends LineLayer<unknown, ExtraPropsT & Required<_ParticleLineLayerProps>> {
  static layerName = 'ParticleLineLayer';
  static defaultProps = defaultProps;

  declare state: LineLayer['state'] & {
    initialized?: boolean;
    numInstances?: number;
    numAgedInstances?: number;
    sourcePositions?: Buffer;
    targetPositions?: Buffer;
    sourceColors?: Buffer;
    targetColors?: Buffer;
    opacities?: Buffer;
    transform?: BufferTransform;
    previousViewportZoom?: number;
    previousTime?: number;
    paletteTexture?: Texture;
    paletteBounds?: [number, number];
  };

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      inject: {
        ...parentShaders.inject,
        'vs:#decl': (parentShaders.inject?.['vs:#decl'] || '') + `
          in float instanceOpacities;
          out float drop;
          const vec4 DROP_COLOR = vec4(0);
          const vec4 HIDE_COLOR = vec4(1, 0, 0, 0);
        `,
        'vs:#main-start': (parentShaders.inject?.['vs:#main-start'] || '') + `
          drop = float(instanceColors == DROP_COLOR || instanceColors == HIDE_COLOR);
        `,
        'vs:DECKGL_FILTER_COLOR': (parentShaders.inject?.['vs:DECKGL_FILTER_COLOR'] || '') + `
          color.a = color.a * instanceOpacities;
        `,
        'fs:#decl': (parentShaders.inject?.['fs:#decl'] || '') + `
          in float drop;
        `,
        'fs:#main-start': (parentShaders.inject?.['fs:#main-start'] || '') + `
          if (drop > 0.5) discard;
        `,
      },
    };
  }

  initializeState(): void {
    super.initializeState();

    this.#setupTransformFeedback();

    const attributeManager = this.getAttributeManager()!;
    attributeManager.remove(['instanceSourcePositions', 'instanceTargetPositions', 'instanceColors', 'instanceWidths']);
    attributeManager.addInstanced({
      instanceSourcePositions: {
        size: 3,
        type: 'float32',
        noAlloc: true,
      },
      instanceTargetPositions: {
        size: 3,
        type: 'float32',
        noAlloc: true,
      },
      instanceColors: {
        size: 4,
        type: 'float32', // unorm8?
        noAlloc: true,
      },
      instanceOpacities: {
        size: 1,
        type: 'float32',
        noAlloc: true,
      },
    });
  }

  updateState(params: UpdateParameters<this>): void {
    const { imageType, numParticles, maxAge, width, palette } = params.props;

    super.updateState(params);

    if (imageType !== ImageType.VECTOR || !numParticles || !maxAge || !width) {
      this.#deleteTransformFeedback();
      return;
    }

    if (
      imageType !== params.oldProps.imageType ||
      numParticles !== params.oldProps.numParticles ||
      maxAge !== params.oldProps.maxAge ||
      width !== params.oldProps.width
    ) {
      this.#setupTransformFeedback();
    }

    if (palette !== params.oldProps.palette) {
      this.#updatePalette();
    }
  }

  finalizeState(context: LayerContext): void {
    this.#deleteTransformFeedback();

    super.finalizeState(context);
  }

  draw(opts: any): void {
    const { initialized } = this.state;
    if (!initialized) {
      return;
    }

    const { viewport } = this.context;
    const { model } = this.state;
    const { minZoom, maxZoom, width, animate } = ensureDefaultProps(this.props, defaultProps);
    const { sourcePositions, targetPositions, sourceColors, opacities, transform } = this.state;
    if (!sourcePositions || !targetPositions || !sourceColors || !opacities || !transform) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.setAttributes({
        instanceSourcePositions: sourcePositions,
        instanceTargetPositions: targetPositions,
        instanceColors: sourceColors,
        instanceOpacities: opacities,
      });
      model.setConstantAttributes({
        instanceSourcePositions64Low: new Float32Array([0, 0, 0]),
        instanceTargetPositions64Low: new Float32Array([0, 0, 0]),
        instanceWidths: new Float32Array([width]),
      });

      super.draw(opts);

      if (animate) {
        this.step();
      }
    }
  }

  #setupTransformFeedback(): void {
    const { device } = this.context;
    const { initialized } = this.state;
    if (initialized) {
      this.#deleteTransformFeedback();
    }

    const { numParticles, maxAge } = ensureDefaultProps(this.props, defaultProps);

    // sourcePositions/targetPositions buffer layout:
    // |          age0             |          age1             |          age2             |...|          age(N-1)         |
    // |pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|pos0,pos1,pos2,...,pos(N-1)|...|pos0,pos1,pos2,...,pos(N-1)|
    const numInstances = numParticles * maxAge;
    const numAgedInstances = numParticles * (maxAge - 1);
    const sourcePositions = device.createBuffer(new Float32Array(numInstances * 3));
    const targetPositions = device.createBuffer(new Float32Array(numInstances * 3));
    const sourceColors = device.createBuffer(new Float32Array(numInstances * 4));
    const targetColors = device.createBuffer(new Float32Array(numInstances * 4));
    const opacities = device.createBuffer(new Float32Array(new Array(numInstances).fill(undefined).map((_, i) => {
      const particleAge = Math.floor(i / numParticles);
      return 1 - particleAge / maxAge;
    })));

    // setup transform feedback for particles age0
    const transform = new BufferTransform(device, {
      vs: updateVs,
      vertexCount: numParticles,

      attributes: {
        [SOURCE_POSITION]: sourcePositions,
        [SOURCE_COLOR]: sourceColors,
      },
      bufferLayout: [
        {name: SOURCE_POSITION, format: 'float32x3'},
        {name: SOURCE_COLOR, format: 'float32x4'}, // unorm8x4?
      ],

      feedbackBuffers: {
        [TARGET_POSITION]: targetPositions,
        [TARGET_COLOR]: targetColors,
      },
      varyings: [TARGET_POSITION, TARGET_COLOR],
    });

    this.setState({
      initialized: true,
      numInstances,
      numAgedInstances,
      sourcePositions,
      targetPositions,
      sourceColors,
      targetColors,
      opacities,
      transform,
      previousViewportZoom: 0,
      previousTime: 0,
    });
  }

  #runTransformFeedback(): void {
    const { initialized } = this.state;
    if (!initialized) {
      return;
    }

    const { device, viewport, timeline } = this.context;
    const { imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, numParticles, maxAge, speedFactor, color } = ensureDefaultProps(this.props, defaultProps);
    const { paletteTexture, paletteBounds, numAgedInstances, sourcePositions, targetPositions, sourceColors, targetColors, transform, previousViewportZoom, previousTime } = this.state;
    if (!imageTexture || typeof numAgedInstances !== 'number' || !sourcePositions || !targetPositions || !sourceColors || !targetColors || !transform) {
      return;
    }
    if (!isRectangularBounds(bounds)) {
      throw new Error('_imageCoordinateSystem only supports rectangular bounds');
    }

    const time = timeline.getTime();
    if (typeof previousTime === 'number' && time < previousTime + 1000 / FPS) {
      return;
    }

    // viewport
    const viewportGlobe = isViewportGlobe(viewport);
    const viewportGlobeCenter = isViewportGlobe(viewport) ? getViewportGlobeCenter(viewport) : null;
    const viewportGlobeRadius = isViewportGlobe(viewport) ? getViewportGlobeRadius(viewport) : null;
    const viewportBounds = isViewportMercator(viewport) ? getViewportBounds(viewport) : null;
    const viewportZoomChangeFactor = 2 ** ((typeof previousViewportZoom === 'number' ? previousViewportZoom - viewport.zoom : 0) * 4);

    // speed factor for current zoom level
    const currentSpeedFactor = speedFactor / 2 ** (viewport.zoom + 7);

    // update particle positions and colors age0
    transform.model.setBindings({
      [updateVsTokens.imageTexture]: imageTexture ?? createEmptyTextureCached(device),
      [updateVsTokens.imageTexture2]: (imageTexture2 !== imageTexture ? imageTexture2 : null) ?? createEmptyTextureCached(device),

      [updateVsTokens.paletteTexture]: paletteTexture ?? createEmptyTextureCached(device),
    });
    transform.model.setUniforms({
      [updateVsTokens.viewportGlobe]: viewportGlobe,
      [updateVsTokens.viewportGlobeCenter]: viewportGlobeCenter ?? [0, 0],
      [updateVsTokens.viewportGlobeRadius]: viewportGlobeRadius ?? 0,
      [updateVsTokens.viewportBounds]: viewportBounds ?? [0, 0, 0, 0],
      [updateVsTokens.viewportZoomChangeFactor]: viewportZoomChangeFactor ?? 0,

      [updateVsTokens.imageResolution]: [imageTexture.width, imageTexture.height],
      [updateVsTokens.imageSmoothing]: imageSmoothing ?? 0,
      [updateVsTokens.imageInterpolation]: Object.values(ImageInterpolation).indexOf(imageInterpolation),
      [updateVsTokens.imageWeight]: imageTexture2 !== imageTexture ? imageWeight : 0,
      [updateVsTokens.imageTypeVector]: imageType === ImageType.VECTOR,
      [updateVsTokens.imageUnscale]: imageUnscale ?? [0, 0],
      [updateVsTokens.imageValueBounds]: [imageMinValue ?? NaN, imageMaxValue ?? NaN],
      [updateVsTokens.bounds]: bounds,

      [updateVsTokens.numParticles]: numParticles,
      [updateVsTokens.maxAge]: maxAge,
      [updateVsTokens.speedFactor]: currentSpeedFactor,

      [updateVsTokens.color]: color ? deckColorToGl(color) : [0, 0, 0, 0],
      [updateVsTokens.paletteBounds]: paletteBounds ?? [0, 0],

      [updateVsTokens.time]: time,
      [updateVsTokens.seed]: Math.random(),
    });
    transform.run({
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      depthReadOnly: true,
      stencilReadOnly: true,
    });

    const commandEncoder = device.createCommandEncoder();

    // update particle positions age1-age(N-1)
    // copy age0-age(N-2) sourcePositions to age1-age(N-1) targetPositions
    commandEncoder.copyBufferToBuffer({
      source: sourcePositions,
      sourceOffset: 0,
      destination: targetPositions,
      destinationOffset: numParticles * 4 * 3,
      size: numAgedInstances * 4 * 3,
    });

    // update particle colors age1-age(N-1)
    // copy age0-age(N-2) colors to age1-age(N-1) colors
    // needs a duplicate copy buffer, because read and write regions overlap
    commandEncoder.copyBufferToBuffer({
      source: sourceColors,
      sourceOffset: 0,
      destination: targetColors,
      destinationOffset: numParticles * 4 * 4,
      size: numAgedInstances * 4 * 4,
    });

    commandEncoder.finish();
    commandEncoder.destroy();

    this.#swapTransformFeedback();

    // console.log(new Float32Array(sourcePositions.readSyncWebGL().slice(0, 4 * 4 * 3).buffer), new Float32Array(targetPositions.readSyncWebGL().slice(0, 4 * 4 * 3).buffer), sourceColors.readSyncWebGL().slice(0, 4 * 4 * 1));

    this.state.previousViewportZoom = viewport.zoom;
    this.state.previousTime = time;
  }

  // see https://github.com/visgl/luma.gl/pull/1883
  #swapTransformFeedback(): void {
    const { sourcePositions, targetPositions, sourceColors, targetColors, transform } = this.state;
    if (!sourcePositions || !targetPositions || !sourceColors || !targetColors || !transform) {
      return;
    }

    this.state.sourcePositions = targetPositions;
    this.state.targetPositions = sourcePositions;
    this.state.sourceColors = targetColors;
    this.state.targetColors = sourceColors;

    transform.model.setAttributes({
      [SOURCE_POSITION]: targetPositions,
      [SOURCE_COLOR]: targetColors,
    });
    transform.transformFeedback.setBuffers({
      [TARGET_POSITION]: sourcePositions,
      [TARGET_COLOR]: sourceColors,
    });
  }

  #resetTransformFeedback(): void {
    const { initialized } = this.state;
    if (!initialized) {
      return;
    }

    const { numInstances, sourcePositions, targetPositions, sourceColors, targetColors } = this.state;
    if (typeof numInstances !== 'number' || !sourcePositions || !targetPositions || !sourceColors || !targetColors) {
      return;
    }

    sourcePositions.write(new Float32Array(numInstances * 3));
    targetPositions.write(new Float32Array(numInstances * 3));
    sourceColors.write(new Float32Array(numInstances * 4));
    targetColors.write(new Float32Array(numInstances * 4));
  }

  #deleteTransformFeedback(): void {
    const { initialized } = this.state;
    if (!initialized) {
      return;
    }

    const { sourcePositions, targetPositions, sourceColors, targetColors, opacities, transform } = this.state;
    if (!sourcePositions || !targetPositions || !sourceColors || !targetColors || !opacities || !transform) {
      return;
    }

    sourcePositions.destroy();
    targetPositions.destroy();
    sourceColors.destroy();
    targetColors.destroy();
    opacities.destroy();
    transform.destroy();

    this.setState({
      initialized: false,
      sourcePositions: undefined,
      targetPositions: undefined,
      sourceColors: undefined,
      targetColors: undefined,
      opacities: undefined,
      transform: undefined,
    });
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

  step(): void {
    this.#runTransformFeedback();

    this.setNeedsRedraw();
  }

  clear(): void {
    this.#resetTransformFeedback();

    this.setNeedsRedraw();
  }
}

function isRectangularBounds(bounds: BitmapBoundingBox): bounds is [number, number, number, number] {
  return Number.isFinite(bounds[0]);
}