import {CompositeLayer, COORDINATE_SYSTEM} from '@deck.gl/core';
import type {LayerProps, DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import {ensureDefaultProps} from '../../_utils/props.js';
import {getViewportPositions} from '../../_utils/viewport.js';
import type {TextureData} from '../../_utils/texture-data.js';
import {createTextureCached, createEmptyTextureCached} from '../../_utils/texture.js';
import {isRepeatBounds} from '../../_utils/bounds.js';
import {RasterBitmapLayer} from './raster-bitmap-layer.js';
import type {RasterBitmapLayerProps} from './raster-bitmap-layer.js';

type _RasterLayerProps = RasterBitmapLayerProps & {
  image: TextureData | null;
  image2: TextureData | null;

  gridEnabled: boolean | null;
};

export type RasterLayerProps = _RasterLayerProps & LayerProps;

const defaultProps: DefaultProps<RasterLayerProps> = {
  ...RasterBitmapLayer.defaultProps,

  imageTexture: undefined,
  imageTexture2: undefined,
  image: {type: 'object', value: null}, // object instead of image to allow reading raw data
  image2: {type: 'object', value: null}, // object instead of image to allow reading raw data

  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  gridEnabled: {type: 'boolean', value: false},
};

export class RasterLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_RasterLayerProps>> {
  static layerName = 'RasterLayer';
  static defaultProps = defaultProps;

  declare state: CompositeLayer['state'] & {
    props?: RasterLayerProps;
    imageTexture?: Texture;
    imageTexture2?: Texture;
    positions?: GeoJSON.Position[];
  };

  renderLayers(): LayersList {
    const {device} = this.context;
    const {props, imageTexture, imageTexture2} = this.state;
    if (!props || !imageTexture) {
      return [];
    }

    const {gridEnabled} = ensureDefaultProps(props, defaultProps);
    let gridLayer;
    if (gridEnabled) {
      const {positions} = this.state;

      gridLayer = new ScatterplotLayer({
        data: positions,
        getPosition: d => d,
        getRadius: 1,
        getFillColor: [255, 255, 255],
        radiusUnits: 'pixels',
        opacity: 0.2,
        parameters: {
          depthCompare: 'always', // disable depth test to avoid conflict with Maplibre globe depth buffer, see https://github.com/visgl/deck.gl/issues/9357
          ...this.props.parameters,
        },
      });
    }

    return [
      new RasterBitmapLayer(this.props, this.getSubLayerProps({
        ...{
          id: 'bitmap',
          imageTexture,
          imageTexture2,

          _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
        } satisfies Partial<RasterLayerProps>,

        image: createEmptyTextureCached(device),
        image2: createEmptyTextureCached(device),
      })),
      ...(gridLayer ? [gridLayer] : []),
    ];
  }

  updateState(params: UpdateParameters<this>): void {
    const {image, image2, imageUnscale, bounds, gridEnabled} = params.props;

    super.updateState(params);

    if (image && imageUnscale && !(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
      throw new Error('imageUnscale can be applied to Uint8 data only');
    }

    if (image !== params.oldProps.image || image2 !== params.oldProps.image2) {
      const {device} = this.context;
      const {image, image2} = this.props;
  
      const imageTexture = image ? createTextureCached(device, image, isRepeatBounds(bounds as GeoJSON.BBox)) : null;
      const imageTexture2 = image2 ? createTextureCached(device, image2, isRepeatBounds(bounds as GeoJSON.BBox)) : null;
  
      this.setState({imageTexture, imageTexture2});
    }

    if (
      image !== params.oldProps.image ||
      gridEnabled !== params.oldProps.gridEnabled
    ) {
      this._updateFeatures();
    }

    this.setState({props: params.props});
  }

  private _updateFeatures(): void {
    const {image, bounds, gridEnabled} = ensureDefaultProps(this.props, defaultProps);
    if (!image) {
      return;
    }

    if (gridEnabled) {
      const startPosition: GeoJSON.Position = [bounds[0] as number, bounds[1] as number];
      const endPosition: GeoJSON.Position = [bounds[2] as number, bounds[3] as number];
      const boundsWidth = endPosition[0] - startPosition[0];
      const boundsHeight = endPosition[1] - startPosition[1];
      const width = image.width;
      const height = image.height;
      const deltaWidth = boundsWidth / (width - (isRepeatBounds(bounds as GeoJSON.BBox) ? 0 : 1));
      const deltaHeight = boundsHeight / (height - 1);
      const positions = new Array(width * height).fill(undefined)
        .map((_, i) => [startPosition[0] + (i % width) * deltaWidth, startPosition[1] + Math.floor(i / width) * deltaHeight]);
      const viewportPositions = getViewportPositions(this.context.viewport, positions);
  
      this.setState({positions: viewportPositions});
    }
  }
}