import type {Color, LayerProps, DefaultProps, UpdateParameters, Viewport, LayerContext} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {BitmapLayerProps, BitmapBoundingBox} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import {DEFAULT_LINE_WIDTH, DEFAULT_LINE_COLOR, DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, ensureDefaultProps} from '../../_utils/props.js';
import {ImageInterpolation} from '../../_utils/image-interpolation.js';
import {ImageType} from '../../_utils/image-type.js';
import type {ImageUnscale} from '../../_utils/image-unscale.js';
import type {UnitFormat} from '../../_utils/unit-format.js';
import {isViewportGlobe, isViewportInZoomBounds, getViewportZoom} from '../../_utils/viewport.js';
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
import {ContourLabelPasses, CONTOUR_LABEL_MAX_GRID_COUNT} from './contour-label-passes.js';
import type {ContourLabelGridProps} from './contour-label-passes.js';
import {sourceCode as fs} from './contour-bitmap-layer.fs.glsl';

const WORLD_SIZE = 512; // Web Mercator world size in deck.gl common space

// Mercator direction of screen right, from the map bearing, globe has no bearing
function getViewportScreenRight(viewport: Viewport): [number, number] {
  const bearing = ('bearing' in viewport && typeof viewport.bearing === 'number' ? viewport.bearing : 0) * Math.PI / 180;
  return [Math.cos(bearing), -Math.sin(bearing)];
}

// Web Mercator bounds of the visible area, sampled with a screen grid, off-globe samples are skipped
function getViewportMercatorBounds(viewport: Viewport): [number, number, number, number] | null {
  const MAX_LATITUDE = 85.051129;
  const SAMPLES = 8;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    for (let j = 0; j <= SAMPLES; j++) {
      const [longitude, latitude] = viewport.unproject([viewport.width * i / SAMPLES, viewport.height * j / SAMPLES]);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        continue;
      }
      const phi = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude)) * Math.PI / 180;
      const x = (longitude + 180) / 360 * WORLD_SIZE;
      const y = (Math.PI + Math.log(Math.tan(Math.PI / 4 + phi / 2))) / (2 * Math.PI) * WORLD_SIZE;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return minX < maxX && minY < maxY ? [minX, minY, maxX, maxY] : null;
}

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

  labelEnabled: boolean;
  labelDensity: number;
  labelMinorContours: boolean;
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

  labelEnabled: {type: 'boolean', value: false},
  labelDensity: {type: 'number', value: 0}, // same as GridLayer density
  labelMinorContours: {type: 'boolean', value: false}, // false: label major contours only
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
    labelPasses?: ContourLabelPasses;
    labelModuleProps?: ContourLabelGridProps;
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

  shouldUpdateState(params: UpdateParameters<this>): boolean {
    // labels are selected per viewport
    return super.shouldUpdateState(params) || (!!this.props.labelEnabled && params.changeFlags.viewportChanged);
  }

  updateState(params: UpdateParameters<this>): void {
    const {palette} = params.props;

    super.updateState(params);

    if (palette !== params.oldProps.palette) {
      this._updatePalette();
    }

    // offscreen passes run in updateState, outside of the deck.gl render pass
    this._updateLabels();
  }

  draw(opts: any): void {
    const {viewport} = this.context;
    const {model, labelModuleProps, labelPasses} = this.state;
    const {imageTexture, minZoom, maxZoom} = ensureDefaultProps(this.props, defaultProps);
    if (!imageTexture) {
      return;
    }

    if (model && isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      const moduleProps = this._getModuleProps();
      model.shaderInputs.setProps({
        ...moduleProps,
        [contourModule.name]: {
          ...moduleProps[contourModule.name],
          ...labelModuleProps,
          ...labelPasses?.getTextures(),
        },
      });

      this.props.image = imageTexture;
      super.draw(opts);
      this.props.image = null;
    }
  }

  finalizeState(context: LayerContext): void {
    super.finalizeState(context);

    this.state.labelAtlas?.texture.destroy();
    this.state.labelPasses?.destroy();
  }

  private _getModuleProps(): {[bitmapModule.name]: BitmapModuleProps, [rasterModule.name]: RasterModuleProps, [paletteModule.name]: PaletteModuleProps, [contourModule.name]: ContourModuleProps} {
    const {device, viewport} = this.context;
    const {imageTexture, imageTexture2, imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue, bounds, _imageCoordinateSystem, transparentColor, color, interval, majorInterval, width, labelMinorContours, unitFormat, textColor, textOutlineColor} = ensureDefaultProps(this.props, defaultProps);
    const {paletteTexture, paletteBounds, labelAtlas} = this.state;
    const viewportGlobe = isViewportGlobe(viewport);

    return {
      [bitmapModule.name]: {
        viewportGlobe, bounds, _imageCoordinateSystem, transparentColor,
      },
      [rasterModule.name]: {
        imageTexture: imageTexture ?? createEmptyTextureCached(device),
        imageTexture2: imageTexture2 ?? createEmptyTextureCached(device),
        imageSmoothing, imageInterpolation, imageWeight, imageType, imageUnscale, imageMinValue, imageMaxValue,
      },
      [paletteModule.name]: {
        paletteTexture: paletteTexture ?? createEmptyTextureCached(device),
        paletteBounds, paletteColor: color,
      },
      [contourModule.name]: {
        interval, majorInterval, width,
        labelTexture: labelAtlas?.texture ?? createEmptyTextureCached(device),
        labelGridSize: 0,
        labelGlobe: viewportGlobe,
        labelMinorContours,
        labelScreenRight: getViewportScreenRight(viewport),
        labelTextureSize: labelAtlas?.size,
        labelCellSize: labelAtlas?.cellSize,
        labelPadding: labelAtlas?.padding,
        labelDecimals: unitFormat?.decimals ?? 0,
        labelScale: unitFormat?.scale ?? 1,
        labelOffset: unitFormat?.offset ?? 0,
        labelColor: textColor,
        labelOutlineColor: textOutlineColor,
      },
    };
  }

  private _updateLabels(): void {
    const {device, viewport} = this.context;
    const {imageTexture, minZoom, maxZoom, labelEnabled, labelDensity, visible} = ensureDefaultProps(this.props, defaultProps);
    const viewportBounds = getViewportMercatorBounds(viewport);
    if (!labelEnabled || !visible || !imageTexture || !viewportBounds || !isViewportInZoomBounds(viewport, minZoom, maxZoom) || !ContourLabelPasses.isSupported(device)) {
      this.setState({labelModuleProps: undefined});
      return;
    }

    // labels are rendered in device pixels, the atlas depends on the pixel ratio
    const pixelRatio = device.getDefaultCanvasContext().cssToDeviceRatio();
    const labelAtlas = this._updateLabelAtlas(pixelRatio);
    const labelPasses = this.state.labelPasses ?? new ContourLabelPasses(device);
    this.setState({labelPasses});

    // candidate grid zoom is chosen the same as in getViewportGridPositions, the grid matches GridLayer with the same density
    // grid cell size is between 64 * 2^-labelDensity and 2 * 64 * 2^-labelDensity pixels
    // the grid is coarsened if the viewport needs more candidates than supported, e.g. in pitched views
    const zoom = getViewportZoom(viewport);
    const labelPixelSize = 1 / (2 ** zoom * pixelRatio);
    let labelGridLevel = Math.max(1, Math.floor(zoom + labelDensity + 3 + (isViewportGlobe(viewport) ? 1 : 0))); // globe +1, same as getViewportGridPositions
    let labelGridSize: number, labelGridOrigin: [number, number], labelGridCount: [number, number];
    while (true) {
      labelGridSize = WORLD_SIZE / 2 ** labelGridLevel;
      const worldColumns = 2 ** labelGridLevel;
      const minColumn = Math.floor(viewportBounds[0] / labelGridSize) - 1;
      const maxColumn = Math.ceil(viewportBounds[2] / labelGridSize) + 1;
      const minRow = Math.floor(viewportBounds[1] / labelGridSize) - 1;
      const maxRow = Math.ceil(viewportBounds[3] / labelGridSize) + 1;
      labelGridOrigin = [minColumn, minRow];
      labelGridCount = [Math.min(maxColumn - minColumn + 1, worldColumns), maxRow - minRow + 1];
      if ((labelGridCount[0] <= CONTOUR_LABEL_MAX_GRID_COUNT && labelGridCount[1] <= CONTOUR_LABEL_MAX_GRID_COUNT) || labelGridLevel <= 1) {
        labelGridCount = [Math.min(labelGridCount[0], CONTOUR_LABEL_MAX_GRID_COUNT), Math.min(labelGridCount[1], CONTOUR_LABEL_MAX_GRID_COUNT)];
        break;
      }
      labelGridLevel--;
    }

    // approximate widest label, 6 chars
    const labelMaxHalfWidth = 6 * (labelAtlas.cellSize[0] - 2 * labelAtlas.padding) / 2 + labelAtlas.padding;
    const labelSearchRadius = Math.min(4, Math.ceil(labelMaxHalfWidth / (labelGridSize / labelPixelSize) + 0.5));
    const labelTraceStep = Math.max(viewportBounds[2] - viewportBounds[0], viewportBounds[3] - viewportBounds[1]) / 200;

    const labelModuleProps: ContourLabelGridProps = {
      labelGridSize,
      labelGridLevel,
      labelGridOrigin,
      labelGridCount,
      labelViewBounds: viewportBounds,
      labelTraceStep,
      labelSearchRadius,
      labelMaxHalfWidth,
      labelPixelSize,
    } satisfies Partial<ContourModuleProps>;
    this.setState({labelModuleProps});

    const moduleProps = this._getModuleProps();
    labelPasses.run({
      [bitmapModule.name]: moduleProps[bitmapModule.name],
      [rasterModule.name]: moduleProps[rasterModule.name],
      [contourModule.name]: {...moduleProps[contourModule.name], ...labelModuleProps},
    }, labelGridCount);
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