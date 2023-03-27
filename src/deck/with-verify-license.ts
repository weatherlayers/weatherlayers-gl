import {CompositeLayer, CompositeLayerProps} from '@deck.gl/core/typed';
import type {Position, DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import {TextLayer} from '@deck.gl/layers/typed';
import type {TextLayerProps} from '@deck.gl/layers/typed';
import {DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../_utils/props.js';
import {randomString} from '../_utils/random-string.js';
import {getViewportAngle} from '../_utils/viewport.js';
import {getViewportGridPositions} from '../_utils/viewport-grid.js';
import {CRYPTO, DATE, TO_ISO_STRING, LOCATION, HOSTNAME, WEATHER_LAYERS_COM} from '../license/license-build.js';
import {verifyLicense} from '../license/license.js';
import type {License} from '../license/license.js';

// keypair generated at 2023-03-27 21:36
const publicKeyRaw = 'BB8crVfPRTepHZWydXQMymaEETZzVkYylbuIxPkXyk8jnQrx5QBa5qWV/c8JdXoLcLhlRETQ73Heaz/aIngMioLUyiX6EE9HzDbuiUw84V49ETANUiJcyZuzEMZ/2OumpA==';

let license: License | null = null;

export function setLicense(currentLicense: License): void {
  license = currentLicense;
}

export function withVerifyLicense<PropsT extends {}>(layerName: string, defaultProps: DefaultProps<PropsT>) {
  return <LayerT extends typeof CompositeLayer<PropsT>>(layerClass: LayerT, _context: ClassDecoratorContext<LayerT>): LayerT => {
    return class extends CompositeLayer<PropsT> {
      // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet, they contain CompositeLayer static field values
      static layerName = layerName;
      static defaultProps = defaultProps;

      // use private fields instead of state so that it's not accessible from outside in any way
      #isWatermarkEnabled = false;
      #watermarkPositions: GeoJSON.Position[] = [];
  
      constructor(...propObjects: Partial<PropsT & CompositeLayerProps>[]) {
        super(...propObjects);

        // update wrapper layer id to a random id, this.props.id stays with original id
        this.id = randomString();
      }

      renderLayers(): LayersList {
        const {viewport} = this.context;

        // create base layer without calling this.getSubLayerProps, so that base layer id uses original id from this.props.id
        // @ts-ignore
        const baseLayer: CompositeLayer<PropsT> = new layerClass(this.props);

        let watermarkLayer: TextLayer<Position> | null = null;
        if (this.#isWatermarkEnabled) {
          // create watermark layer without calling this.getSubLayerProps, so that watermark layer id is random
          watermarkLayer = new TextLayer({
            id: randomString(),
            data: this.#watermarkPositions,
            getPosition: d => d,
            getText: () => WEATHER_LAYERS_COM,
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
        this.#verifyLicense();
      }

      updateState(params: UpdateParameters<this>): void {
        super.updateState(params);
    
        if (this.#isWatermarkEnabled && params.changeFlags.viewportChanged) {
          this.#updateWatermarkPositions();
        }
      }

      async #verifyLicense(): Promise<void> {
        const isLicenseValid = await verifyLicense(globalThis[CRYPTO], publicKeyRaw, license, new globalThis[DATE]()[TO_ISO_STRING](), globalThis[LOCATION][HOSTNAME]);
        const isLicenseInvalid = !isLicenseValid;

        this.#isWatermarkEnabled = isLicenseInvalid;

        this.#updateWatermarkPositions();
      }

      #updateWatermarkPositions(): void {
        const {viewport} = this.context;
    
        if (this.#isWatermarkEnabled) {
          this.#watermarkPositions = getViewportGridPositions(viewport, 1);
      
          // trigger refresh after updating a private field
          this.setState({});
        }
      }
    } as unknown as LayerT;
  };
}