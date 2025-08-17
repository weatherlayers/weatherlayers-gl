import type {Color, LayerProps, DefaultProps, UpdateParameters, GetPickingInfoParams} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {BitmapLayerProps, BitmapBoundingBox, BitmapLayerPickingInfo} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, ensureDefaultProps} from '../../_utils/props.js';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../_utils/image-type.js';
import type {ImageUnscale} from '../../_utils/image-unscale.js';
import {isViewportGlobe, isViewportInZoomBounds} from '../../_utils/viewport.js';
import type {RasterPointProperties} from '../../_utils/raster-data.js';
import {parsePalette} from '../../_utils/palette.js';
import type {Palette} from '../../_utils/palette.js';
import {createPaletteTexture} from '../../_utils/palette-texture.js';
import {createEmptyTextureCached} from '../../_utils/texture.js';
import {bitmapModule} from '../../shaderlib/bitmap-module/bitmap-module.js';
import type {BitmapModuleProps} from '../../shaderlib/bitmap-module/bitmap-module.js';
import {rasterModule} from '../../shaderlib/raster-module/raster-module.js';
import type {RasterModuleProps} from '../../shaderlib/raster-module/raster-module.js';
import {paletteModule} from '../../shaderlib/palette-module/palette-module.js';
import type {PaletteModuleProps} from '../../shaderlib/palette-module/palette-module.js';
import {sourceCode as fs} from './raster-bitmap-layer.fs.glsl';

type _RasterBitmapLayerProps = BitmapLayerProps & {
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

  palette: Palette | null;
  borderEnabled: boolean | null;
  borderWidth: number | null;
  borderColor: Color | null;
  gridEnabled: boolean | null;
  gridSize: number | null;
  gridColor: Color | null;
};

export type RasterBitmapLayerProps = _RasterBitmapLayerProps & LayerProps;

const defaultProps: DefaultProps<RasterBitmapLayerProps> = {
  imageTexture: {type: 'object', value: null},
  imageTexture2: {type: 'object', value: null},
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'object', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'object', value: ImageType.SCALAR},
  imageUnscale: {type: 'array', value: null},
  imageMinValue: {type: 'object', value: null},
  imageMaxValue: {type: 'object', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  minZoom: {type: 'object', value: null},
  maxZoom: {type: 'object', value: null},

  palette: {type: 'object', value: null},
  borderEnabled: {type: 'boolean', value: false},
  borderWidth: {type: 'number', value: DEFAULT_LINE_WIDTH},
  borderColor: {type: 'color', value: DEFAULT_LINE_COLOR},
  gridEnabled: {type: 'boolean', value: false},
  gridSize: {type: 'number', value: DEFAULT_LINE_WIDTH},
  gridColor: {type: 'color', value: DEFAULT_LINE_COLOR},
};

export class RasterBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<ExtraPropsT & Required<_RasterBitmapLayerProps>> {
  static layerName = 'RasterBitmapLayer';
  static defaultProps = defaultProps;

  declare state: BitmapLayer['state'] & {
    paletteTexture?: Texture;
    paletteBounds?: [number, number];
  };

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      fs,
      modules: [...parentShaders.modules, bitmapModule, rasterModule, paletteModule],
    };
  }

  updateState(params: UpdateParameters<this>): void {
    const {palette} = params.props;

    super.updateState(params);

    if (palette !== params.oldProps.palette) {
      this._updatePalette();
    }
  }

  draw(opts: any): void {
    const {device, viewport} = this.context;
    const {model} = this.state;
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, _imageCoordinateSystem, transparentColor, minZoom, maxZoom, borderEnabled, borderWidth, borderColor, gridEnabled, gridSize, gridColor} = ensureDefaultProps(this.props, defaultProps);
    const {paletteTexture, paletteBounds} = this.state;
    if (!imageTexture) {
      return;
    }

    // viewport
    const viewportGlobe = isViewportGlobe(viewport);

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      model.shaderInputs.setProps({
        [bitmapModule.name]: {
          viewportGlobe, bounds, _imageCoordinateSystem, transparentColor,
        } satisfies BitmapModuleProps,
        [rasterModule.name]: {
          imageTexture: imageTexture ?? createEmptyTextureCached(device),
          imageTexture2: imageTexture2 ?? createEmptyTextureCached(device),
          imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue,
          borderEnabled, borderWidth, borderColor,
          gridEnabled, gridSize, gridColor,
        } satisfies RasterModuleProps,
        [paletteModule.name]: {
          paletteTexture: paletteTexture ?? createEmptyTextureCached(device),
          paletteBounds,
        } satisfies PaletteModuleProps,
      });
      
      model.setParameters({
        ...model.parameters,
        cullMode: 'back', // enable culling to avoid rendering on both sides of the globe
        depthCompare: 'always', // disable depth test to avoid conflict with Maplibre globe depth buffer, see https://github.com/visgl/deck.gl/issues/9357
        ...this.props.parameters,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }

  private _updatePalette(): void {
    const {device} = this.context;
    const {palette} = ensureDefaultProps(this.props, defaultProps);
    if (!palette) {
      this.setState({paletteTexture: undefined, paletteBounds: undefined});
      return;
    }

    const paletteScale = parsePalette(palette);
    const {paletteBounds, paletteTexture} = createPaletteTexture(device, paletteScale);

    this.setState({paletteTexture, paletteBounds});
  }

  private _getRasterMagnitudeValue(color: Uint8Array, paletteBounds: [number, number]): number {
    return paletteBounds[0] + color[0] / 255 * (paletteBounds[1] - paletteBounds[0]);
  }

  private _getRasterDirectionValue(color: Uint8Array): number {
    const {imageType} = ensureDefaultProps(this.props, defaultProps);
    if (imageType === ImageType.VECTOR) {
      return color[1] / 255 * 360;
    } else {
      return NaN;
    }
  }

  getPickingInfo(params: GetPickingInfoParams): BitmapLayerPickingInfo {
    const info: BitmapLayerPickingInfo & {raster?: RasterPointProperties} = super.getPickingInfo(params);
    const {imageType} = ensureDefaultProps(this.props, defaultProps);
    const {paletteBounds} = this.state;
    if (!info.color) {
      return info;
    }

    let rasterPointProperties: RasterPointProperties;
    const value = this._getRasterMagnitudeValue(info.color, paletteBounds ?? [0, 0]);
    if (imageType === ImageType.VECTOR) {
      const direction = this._getRasterDirectionValue(info.color);
      rasterPointProperties = {value, direction};
    } else {
      rasterPointProperties = {value};
    }
    info.raster = rasterPointProperties;

    return info;
  }
}