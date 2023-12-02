import { CompositeLayer } from '@deck.gl/core/typed';
import type { Position, Color, LayerProps, DefaultProps, CompositeLayerProps, LayerExtension, UpdateParameters, LayersList } from '@deck.gl/core/typed';
import { PathLayer, IconLayer, TextLayer } from '@deck.gl/layers/typed';
import type { PathLayerProps, IconLayerProps, TextLayerProps } from '@deck.gl/layers/typed';
import { CollisionFilterExtension, PathStyleExtension } from '@deck.gl/extensions/typed';
import type { CollisionFilterExtensionProps, PathStyleExtensionProps } from '@deck.gl/extensions/typed';
import { DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR, ensureDefaultProps } from '../../../_utils/props.js';
import { isViewportInZoomBounds, getViewportAngle } from '../../../_utils/viewport.js';
import { FrontType, iconAtlas, iconMapping } from './front-type.js';
import { getFrontLine } from './front-line.js';
import type { FrontLine, FrontIcon } from './front-line.js';

const DEFAULT_WIDTH = 2;
const DEFAULT_COLD_COLOR: Color = [0, 0, 255];
const DEFAULT_WARM_COLOR: Color = [255, 0, 0];
const DEFAULT_OCCLUDED_COLOR: Color = [148, 0, 211];
const DEFAULT_ICON_SIZE = 15;

const FRONT_ICON_COLLISION_GROUP = 'front-icon';

interface DebugFrontPoint<DataT> {
  d: DataT;
  position: Position;
  index: number;
}

type _FrontCompositeLayerProps<DataT> = CompositeLayerProps & {
  data: DataT[];
  minZoom: number | null;
  maxZoom: number | null;

  getType: ((d: DataT) => FrontType) | null;
  getPath: ((d: DataT) => Position[]) | null;
  width: number;
  coldColor: Color;
  warmColor: Color;
  occludedColor: Color;
  iconSize: number;

  _debug: boolean;
}

export type FrontCompositeLayerProps<DataT> = _FrontCompositeLayerProps<DataT> & LayerProps;

const defaultProps: DefaultProps<FrontCompositeLayerProps<any>> = {
  data: { type: 'array', value: [] },
  minZoom: { type: 'object', value: null },
  maxZoom: { type: 'object', value: null },

  getType: { type: 'function', value: null },
  getPath: { type: 'function', value: null },
  width: { type: 'number', value: DEFAULT_WIDTH },
  coldColor: { type: 'color', value: DEFAULT_COLD_COLOR },
  warmColor: { type: 'color', value: DEFAULT_WARM_COLOR },
  occludedColor: { type: 'color', value: DEFAULT_OCCLUDED_COLOR },
  iconSize: { type: 'number', value: DEFAULT_ICON_SIZE },

  _debug: { type: 'boolean', value: false },
};

export class FrontCompositeLayer<DataT = any, ExtraPropsT extends {} = {}> extends CompositeLayer<ExtraPropsT & Required<_FrontCompositeLayerProps<DataT>>> {
  static layerName = 'FrontCompositeLayer';
  static defaultProps = defaultProps;

  renderLayers(): LayersList {
    const { viewport } = this.context;
    const { props, visibleFrontLines, visibleDebugFrontPoints } = this.state;
    if (!props || !visibleFrontLines || !visibleDebugFrontPoints) {
      return [];
    }

    const { getType, getPath, width, coldColor, warmColor, occludedColor, iconSize, _debug: debug } = ensureDefaultProps<FrontCompositeLayerProps<DataT>>(props, defaultProps);
    if (!getType || !getPath) {
      return [];
    }

    const FrontTypeToColor: { [key in FrontType]: Color } = {
      [FrontType.COLD]: coldColor,
      [FrontType.WARM]: warmColor,
      [FrontType.OCCLUDED]: occludedColor,
      [FrontType.STATIONARY]: coldColor,
    };

    // render front line from front points instead of the original path, to workaround for front points detaching from the front line when over-zooming
    return [
      new PathLayer(this.getSubLayerProps({
        id: 'path',
        data: visibleFrontLines,
        getPath: d => [d.startPosition, ...d.icons.map(point => point.position), d.endPosition],
        getColor: d => FrontTypeToColor[getType(d.d)],
        getWidth: width,
        widthUnits: 'pixels',
      } satisfies PathLayerProps<FrontLine<DataT>>)),

      new PathLayer(this.getSubLayerProps({
        id: 'path-stationary-warm',
        data: (visibleFrontLines as FrontLine<DataT>[]).filter(d => getType(d.d) === FrontType.STATIONARY),
        getPath: d => [d.startPosition, ...d.icons.map(point => point.position), d.endPosition],
        getColor: warmColor,
        getWidth: width,
        widthUnits: 'pixels',

        extensions: [new PathStyleExtension({ dash: true, highPrecisionDash: true })] as LayerExtension<any>[],
        getDashArray: [DEFAULT_ICON_SIZE * 3, DEFAULT_ICON_SIZE * 3],
      } satisfies PathLayerProps<FrontLine<DataT>> & PathStyleExtensionProps<FrontLine<DataT>>)),

      new IconLayer(this.getSubLayerProps({
        id: 'icon',
        data: (visibleFrontLines as FrontLine<DataT>[]).flatMap(d => d.icons),
        getPosition: d => d.position,
        getIcon: d => getType(d.d) === FrontType.OCCLUDED || getType(d.d) === FrontType.STATIONARY
          ? (d.alternate
            ? FrontType.COLD
            : FrontType.WARM)
          : getType(d.d),
        getSize: iconSize,
        getColor: d => getType(d.d) === FrontType.STATIONARY
          ? (d.alternate
            ? FrontTypeToColor[FrontType.COLD]
            : FrontTypeToColor[FrontType.WARM])
          : FrontTypeToColor[getType(d.d)],
        getAngle: d => getType(d.d) === FrontType.STATIONARY
          ? (d.alternate
            ? getViewportAngle(viewport, d.direction)
            : getViewportAngle(viewport, d.direction + 180))
          : getViewportAngle(viewport, d.direction),
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionEnabled: true,
        collisionGroup: FRONT_ICON_COLLISION_GROUP,
        collisionTestProps: { sizeScale: 5 },
        getCollisionPriority: (d: FrontIcon<DataT>) => d.priority,
      } satisfies IconLayerProps<FrontIcon<DataT>> & CollisionFilterExtensionProps<FrontIcon<DataT>>)),

      ...(debug ? [
        new TextLayer(this.getSubLayerProps({
          id: 'text',
          data: visibleDebugFrontPoints,
          getPosition: d => d.position,
          getText: d => `${d.index}`,
          getSize: DEFAULT_TEXT_SIZE,
          getColor: DEFAULT_TEXT_COLOR,
          getAngle: getViewportAngle(viewport, 0),
          outlineWidth: DEFAULT_TEXT_OUTLINE_WIDTH,
          outlineColor: DEFAULT_TEXT_OUTLINE_COLOR,
          fontFamily: DEFAULT_TEXT_FONT_FAMILY,
          fontSettings: { sdf: true },
          billboard: false,
        } satisfies TextLayerProps<DebugFrontPoint<DataT>>)),
      ] : []),
    ];
  }

  shouldUpdateState(params: UpdateParameters<this>): boolean {
    return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
  }

  updateState(params: UpdateParameters<this>): void {
    const { data, getType, getPath, minZoom, maxZoom } = params.props;

    super.updateState(params);

    if (!data || !getType || !getPath) {
      this.setState({
        features: undefined,
        debugFeatures: undefined,
        visibleFeatures: undefined,
        visibleDebugFeatures: undefined,
      });
      return;
    }

    if (
      data !== params.oldProps.data ||
      getPath !== params.oldProps.getPath
    ) {
      this.#updateFeatures();
    }

    if (
      minZoom !== params.oldProps.minZoom ||
      maxZoom !== params.oldProps.maxZoom ||
      params.changeFlags.viewportChanged
    ) {
      this.#updateVisibleFeatures();
    }

    this.setState({ props: params.props });
  }

  #updateFeatures(): void {
    const { data, getPath } = ensureDefaultProps<FrontCompositeLayerProps<DataT>>(this.props, defaultProps);
    if (!getPath) {
      return;
    }

    const frontLines: FrontLine<DataT>[] = data.map(d => getFrontLine(d, getPath(d)));
    const debugFrontPoints: DebugFrontPoint<DataT>[] = data.flatMap(d => getPath(d).map((position, index) => ({ d, position, index })));

    this.setState({ frontLines, debugFrontPoints });
  }

  #updateVisibleFeatures(): void {
    const { viewport } = this.context;
    const { minZoom, maxZoom } = ensureDefaultProps<FrontCompositeLayerProps<DataT>>(this.props, defaultProps);
    const { frontLines, debugFrontPoints } = this.state;

    let visibleFrontLines: FrontLine<DataT>[];
    let visibleDebugFrontPoints: DebugFrontPoint<DataT>[];
    if (isViewportInZoomBounds(viewport, minZoom, maxZoom)) {
      visibleFrontLines = frontLines;
      visibleDebugFrontPoints = debugFrontPoints;
    } else {
      visibleFrontLines = [];
      visibleDebugFrontPoints = [];
    }

    this.setState({ visibleFrontLines, visibleDebugFrontPoints });
  }
}