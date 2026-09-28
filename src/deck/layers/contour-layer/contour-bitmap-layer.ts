import type {Color, LayerProps, DefaultProps, UpdateParameters} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {BitmapLayerProps, BitmapBoundingBox} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, ensureDefaultProps} from '../../_utils/props.js';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../_utils/image-type.js';
import type {ImageUnscale} from '../../_utils/image-unscale.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {isViewportGlobe, isViewportInZoomBounds} from '../../_utils/viewport.js';
import {parsePalette} from '../../_utils/palette.js';
import type {Palette} from '../../_utils/palette.js';
import {createPaletteTexture} from '../../_utils/palette-texture.js';
import {createEmptyTextureCached} from '../../_utils/texture.js';
import {bitmapModule, coordinateConversionToken} from '../../shaderlib/bitmap-module/bitmap-module.js';
import type {BitmapModuleProps} from '../../shaderlib/bitmap-module/bitmap-module.js';
import {rasterModule} from '../../shaderlib/raster-module/raster-module.js';
import type {RasterModuleProps} from '../../shaderlib/raster-module/raster-module.js';
import {paletteModule} from '../../shaderlib/palette-module/palette-module.js';
import type {PaletteModuleProps} from '../../shaderlib/palette-module/palette-module.js';
import {contourModule} from './contour-module.js';
import type {ContourModuleProps} from './contour-module.js';
import {createContourLabelAtlas} from './contour-label-atlas.js';
import type {ContourLabelAtlas} from './contour-label-atlas.js';
import {sourceCode as fs} from './contour-bitmap-layer.fs.glsl';

type _ContourBitmapLayerProps = BitmapLayerProps & {
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
  color: Color | null;

  interval: number;
  majorInterval: number;
  width: number;

  labelSpacing: number;
  unitFormat: UnitFormat | null;
  textFontFamily: string;
  textSize: number;
  textColor: Color;
  textOutlineWidth: number;
  textOutlineColor: Color;
}

export type ContourBitmapLayerProps = _ContourBitmapLayerProps & LayerProps;

const defaultProps: DefaultProps<ContourBitmapLayerProps> = {
  imageTexture: {type: 'object', value: null},
  imageTexture2: {type: 'object', value: null},
  imageSmoothing: {type: 'number', value: 0},
  imageInterpolation: {type: 'object', value: ImageInterpolation.CUBIC},
  imageWeight: {type: 'number', value: 0},
  imageType: {type: 'object', value: ImageType.SCALAR},
  imageUnscale: {type: 'object', value: null},
  imageMinValue: {type: 'object', value: null},
  imageMaxValue: {type: 'object', value: null},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  minZoom: {type: 'object', value: null},
  maxZoom: {type: 'object', value: 10}, // drop rendering artifacts in high zoom levels due to a low precision

  palette: {type: 'object', value: null},
  color: {type: 'color', value: DEFAULT_LINE_COLOR},

  interval: {type: 'number', value: 0},
  majorInterval: {type: 'number', value: 0},
  width: {type: 'number', value: DEFAULT_LINE_WIDTH},

  labelSpacing: {type: 'number', value: 0}, // 0: labels disabled
  unitFormat: {type: 'object', value: null},
  textFontFamily: {type: 'object', value: DEFAULT_TEXT_FONT_FAMILY},
  textSize: {type: 'number', value: DEFAULT_TEXT_SIZE},
  textColor: {type: 'color', value: DEFAULT_TEXT_COLOR},
  textOutlineWidth: {type: 'number', value: DEFAULT_TEXT_OUTLINE_WIDTH},
  textOutlineColor: {type: 'color', value: DEFAULT_TEXT_OUTLINE_COLOR},
};

export class ContourBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<ExtraPropsT & Required<_ContourBitmapLayerProps>> {
  static layerName = 'ContourBitmapLayer';
  static defaultProps = defaultProps;

  declare state: BitmapLayer['state'] & {
    paletteTexture?: Texture;
    paletteBounds?: [number, number];
    labelAtlas?: ContourLabelAtlas;
    labelAtlasKey?: string;
  };

  getShaders(): any {
    const parentShaders = super.getShaders();

    return {
      ...parentShaders,
      vs: parentShaders.vs.replaceAll('bitmap.coordinateConversion', `bitmap2.${coordinateConversionToken}`),
      fs,
      modules: [...parentShaders.modules.filter((module: any) => module.name !== 'bitmap'), bitmapModule, rasterModule, paletteModule, contourModule],
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
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, _imageCoordinateSystem, transparentColor, minZoom, maxZoom, color, interval, majorInterval, width, labelSpacing, unitFormat, textColor, textOutlineColor} = ensureDefaultProps(this.props, defaultProps);
    const {paletteTexture, paletteBounds} = this.state;
    if (!imageTexture) {
      return;
    }

    // viewport
    const viewportGlobe = isViewportGlobe(viewport);

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      // labels are rendered in device pixels, the atlas depends on the pixel ratio
      // labels are not supported in globe, screen-space extrapolation of texture coordinates is not precise enough there
      const pixelRatio = device.getDefaultCanvasContext().cssToDeviceRatio();
      const labelAtlas = labelSpacing > 0 && !viewportGlobe ? this._updateLabelAtlas(pixelRatio) : undefined;


      model.shaderInputs.setProps({
        [bitmapModule.name]: {
          viewportGlobe, bounds, _imageCoordinateSystem, transparentColor,
        } satisfies BitmapModuleProps,
        [rasterModule.name]: {
          imageTexture: imageTexture ?? createEmptyTextureCached(device),
          imageTexture2: imageTexture2 ?? createEmptyTextureCached(device),
          imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue,
        } satisfies RasterModuleProps,
        [paletteModule.name]: {
          paletteTexture: paletteTexture ?? createEmptyTextureCached(device),
          paletteBounds, paletteColor: color,
        } satisfies PaletteModuleProps,
        [contourModule.name]: {
          interval, majorInterval, width,
          labelTexture: labelAtlas?.texture ?? createEmptyTextureCached(device),
          labelSpacing: labelAtlas ? labelSpacing * pixelRatio : 0,
          labelTextureSize: labelAtlas?.size,
          labelCellSize: labelAtlas?.cellSize,
          labelPadding: labelAtlas?.padding,
          labelDecimals: unitFormat?.decimals ?? 0,
          labelScale: unitFormat?.scale ?? 1,
          labelOffset: unitFormat?.offset ?? 0,
          labelColor: textColor,
          labelOutlineColor: textOutlineColor,
        } satisfies ContourModuleProps,
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }

  finalizeState(context: any): void {
    super.finalizeState(context);

    this.state.labelAtlas?.texture.destroy();
  }

  private _updateLabelAtlas(pixelRatio: number): ContourLabelAtlas {
    const {device} = this.context;
    const {textFontFamily, textSize, textOutlineWidth} = ensureDefaultProps(this.props, defaultProps);
    const fontSize = Math.round(textSize * pixelRatio);
    const outlineWidth = textOutlineWidth * fontSize / 6; // relative to font size, default 2px for 12px text
    const labelAtlasKey = JSON.stringify([textFontFamily, fontSize, outlineWidth]);
    if (this.state.labelAtlas && this.state.labelAtlasKey === labelAtlasKey) {
      return this.state.labelAtlas;
    }

    this.state.labelAtlas?.texture.destroy();
    const labelAtlas = createContourLabelAtlas(device, {fontFamily: textFontFamily, fontSize, outlineWidth});
    this.state.labelAtlas = labelAtlas;
    this.state.labelAtlasKey = labelAtlasKey;
    return labelAtlas;
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
}