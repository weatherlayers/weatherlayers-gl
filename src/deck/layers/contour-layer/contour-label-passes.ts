import type {Device, Framebuffer, Texture} from '@luma.gl/core';
import {Model, Geometry} from '@luma.gl/engine';
import {createEmptyTextureCached} from '../../_utils/texture.js';
import {bitmapModule} from '../../shaderlib/bitmap-module/bitmap-module.js';
import {rasterModule} from '../../shaderlib/raster-module/raster-module.js';
import {contourModule} from './contour-module.js';
import {sourceCode as anchorFs} from './contour-label-anchor.fs.glsl';
import {sourceCode as selectFs} from './contour-label-select.fs.glsl';

// must match LABEL_MAX_GRID_COUNT in contour-label.glsl
export const CONTOUR_LABEL_MAX_GRID_COUNT = 64;

// fullscreen quad, ClipSpace from @luma.gl/engine is not available in deck.gl UMD bundle
const VS = `\
#version 300 es
in vec2 positions;
void main(void) {
  gl_Position = vec4(positions, 0., 1.);
}
`;

// types are declared here instead of derived from ContourModuleProps, so that public declarations don't reference GLSL sources
export type ContourLabelTextures = {
  labelAnchorTexture: Texture;
  labelVisibleTexture: Texture;
};

export type ContourLabelGridProps = {
  labelGridSize: number;
  labelGridLevel: number;
  labelGridOrigin: [number, number];
  labelGridCount: [number, number];
  labelViewBounds: [number, number, number, number];
  labelTraceStep: number;
  labelSearchRadius: number;
  labelMaxHalfWidth: number;
  labelPixelSize: number;
};

// GPU passes selecting roughly a single label per visible contour, each texel is a label candidate
// 1. anchor - anchor of each grid seed on the nearest labeled contour, and the contour identity
// 2. select - visible candidates, the candidate with the highest priority per contour
export class ContourLabelPasses {
  private readonly device: Device;
  private readonly anchorModel: Model;
  private readonly selectModel: Model;
  private anchorFramebuffer: Framebuffer | null = null;
  private visibleFramebuffer: Framebuffer | null = null;

  constructor(device: Device) {
    this.device = device;
    this.anchorModel = this._createModel('contour-label-anchor', anchorFs);
    this.selectModel = this._createModel('contour-label-select', selectFs);
  }

  static isSupported(device: Device): boolean {
    return device.features.has('float32-renderable-webgl');
  }

  getTextures(): ContourLabelTextures {
    const emptyTexture = createEmptyTextureCached(this.device);
    return {
      labelAnchorTexture: this.anchorFramebuffer?.colorAttachments[0].texture ?? emptyTexture,
      labelVisibleTexture: this.visibleFramebuffer?.colorAttachments[0].texture ?? emptyTexture,
    };
  }

  run(moduleProps: Record<string, any>, gridCount: [number, number]): void {
    this._ensureFramebuffers(gridCount);

    // bind only textures sampled by the pass, unused samplers are not in the shader layout
    this._runPass(this.anchorModel, this.anchorFramebuffer!, gridCount, {
      ...moduleProps,
      [contourModule.name]: {...moduleProps[contourModule.name], labelTexture: undefined},
    });
    this._runPass(this.selectModel, this.visibleFramebuffer!, gridCount, {
      ...moduleProps,
      [rasterModule.name]: {...moduleProps[rasterModule.name], imageTexture: undefined, imageTexture2: undefined},
      [contourModule.name]: {...moduleProps[contourModule.name], labelTexture: undefined, labelAnchorTexture: this.getTextures().labelAnchorTexture},
    });
  }

  destroy(): void {
    this.anchorModel.destroy();
    this.selectModel.destroy();
    this._destroyFramebuffers();
  }

  private _createModel(id: string, fs: string): Model {
    return new Model(this.device, {
      id,
      vs: VS,
      fs,
      geometry: new Geometry({
        topology: 'triangle-strip',
        vertexCount: 4,
        attributes: {
          positions: {size: 2, value: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])},
        },
      }),
      modules: [bitmapModule, rasterModule, contourModule],
      parameters: {
        blend: false, // disable blending enabled by deck.gl, the alpha channel contains data
        cullMode: 'none',
        depthCompare: 'always',
        depthWriteEnabled: false,
      },
    });
  }

  private _runPass(model: Model, framebuffer: Framebuffer, gridCount: [number, number], moduleProps: Record<string, any>): void {
    model.shaderInputs.setProps(moduleProps);
    const renderPass = this.device.beginRenderPass({
      framebuffer,
      parameters: {viewport: [0, 0, gridCount[0], gridCount[1]]},
      clearColor: [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false,
    });
    model.draw(renderPass);
    renderPass.end();
  }

  private _ensureFramebuffers(gridCount: [number, number]): void {
    if (this.anchorFramebuffer && this.anchorFramebuffer.width === gridCount[0] && this.anchorFramebuffer.height === gridCount[1]) {
      return;
    }

    this._destroyFramebuffers();
    this.anchorFramebuffer = this._createFramebuffer(gridCount);
    this.visibleFramebuffer = this._createFramebuffer(gridCount);
  }

  private _createFramebuffer(gridCount: [number, number]): Framebuffer {
    const texture = this.device.createTexture({
      format: 'rgba32float',
      width: gridCount[0],
      height: gridCount[1],
      mipLevels: 1,
      sampler: {
        // float textures are not filterable
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      },
    });
    return this.device.createFramebuffer({
      width: gridCount[0],
      height: gridCount[1],
      colorAttachments: [texture],
    });
  }

  private _destroyFramebuffers(): void {
    for (const framebuffer of [this.anchorFramebuffer, this.visibleFramebuffer]) {
      framebuffer?.colorAttachments[0].texture.destroy();
      framebuffer?.destroy();
    }
    this.anchorFramebuffer = null;
    this.visibleFramebuffer = null;
  }
}
