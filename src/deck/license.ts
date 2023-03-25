import {CompositeLayer, CompositeLayerProps} from '@deck.gl/core/typed';
import type {Position, DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import {TextLayer} from '@deck.gl/layers/typed';
import type {TextLayerProps} from '@deck.gl/layers/typed';
import {DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../_utils/props.js';
import {randomString} from '../_utils/random-string.js';
import {getViewportAngle} from '../_utils/viewport.js';
import {getViewportGridPositions} from '../_utils/viewport-grid.js';
import {BASE_LAYER_ENABLED, WATERMARK_LAYER_ENABLED, WEATHER_LAYERS} from './license-build.js';

export function withCheckLicense<PropsT extends {}>(layerName: string, defaultProps: DefaultProps<PropsT>) {
  return <LayerT extends typeof CompositeLayer<PropsT>>(layerClass: LayerT, _context: ClassDecoratorContext<LayerT>) => {
    return class extends CompositeLayer<PropsT> {
      // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet, they contain CompositeLayer static field values
      static layerName = layerName;
      static defaultProps = defaultProps;
  
      constructor(...propObjects: Partial<PropsT & CompositeLayerProps>[]) {
        super(...propObjects);

        // update wrapper layer id to a random id, this.props.id stays with original id
        this.id = randomString();
      }

      renderLayers(): LayersList {
        const {viewport} = this.context;
        const {positions} = this.state;

        let baseLayer: CompositeLayer<PropsT> | undefined = undefined;
        if (BASE_LAYER_ENABLED) {
          // create base layer without calling this.getSubLayerProps, so that base layer id uses original id from this.props.id
          // @ts-ignore
          baseLayer = new layerClass(this.props);
        }

        let watermarkLayer: TextLayer<Position> | undefined = undefined;
        if (WATERMARK_LAYER_ENABLED) {
          // create watermark layer without calling this.getSubLayerProps, so that watermark layer id is random
          watermarkLayer = new TextLayer({
            id: randomString(),
            data: positions,
            getPosition: d => d,
            getText: () => WEATHER_LAYERS,
            getSize: DEFAULT_TEXT_SIZE * 1.333,
            getColor: DEFAULT_TEXT_COLOR,
            getAngle: getViewportAngle(viewport, 0),
            outlineWidth: DEFAULT_TEXT_OUTLINE_WIDTH,
            outlineColor: DEFAULT_TEXT_OUTLINE_COLOR,
            fontFamily: DEFAULT_TEXT_FONT_FAMILY,
            fontWeight: 'bold',
            fontSettings: { sdf: true },
            billboard: false,
            opacity: 0.01,
          } satisfies TextLayerProps<Position>);
        }

        return [baseLayer, watermarkLayer];
      }

      shouldUpdateState(params: UpdateParameters<this>): boolean {
        return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
      }
    
      initializeState(): void {
        if (WATERMARK_LAYER_ENABLED) {
          this.updatePositions();
        }
      }

      updateState(params: UpdateParameters<this>): void {
        super.updateState(params);
    
        if (WATERMARK_LAYER_ENABLED && params.changeFlags.viewportChanged) {
          this.updatePositions();
        }
      }

      updatePositions(): void {
        const {viewport} = this.context;
    
        const positions = getViewportGridPositions(viewport, 1);
    
        this.setState({ positions });
      }
    };
  };
}