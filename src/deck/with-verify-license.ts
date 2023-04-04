import {CompositeLayer, CompositeLayerProps} from '@deck.gl/core/typed';
import type {Position, DefaultProps, UpdateParameters, LayersList} from '@deck.gl/core/typed';
import {TextLayer} from '@deck.gl/layers/typed';
import type {TextLayerProps} from '@deck.gl/layers/typed';
import {wrap} from 'comlink';
import {DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../_utils/props.js';
import {randomString} from '../_utils/random-string.js';
import {getViewportAngle} from '../_utils/viewport.js';
import {getViewportGridPositions} from '../_utils/viewport-grid.js';
import createLicenseWorker from 'worker!../license/license-worker.js';
import {LicenseWorker} from '../license/license-worker.js';
import type {License} from '../license/license.js';

// https://anseki.github.io/gnirts/
// @ts-ignore
const WEATHER_LAYERS_COM: 'WeatherLayers.com' = (13).toString(36).toLowerCase().split('').map(function(G){return String.fromCharCode(G.charCodeAt()+(-13))}).join('')+(14).toString(36).toLowerCase()+(function(){var H=Array.prototype.slice.call(arguments),u=H.shift();return H.reverse().map(function(E,h){return String.fromCharCode(E-u-12-h)}).join('')})(55,184,164)+(17).toString(36).toLowerCase()+(function(){var r=Array.prototype.slice.call(arguments),e=r.shift();return r.reverse().map(function(G,K){return String.fromCharCode(G-e-54-K)}).join('')})(5,159,137,174,160)+(1605448).toString(36).toLowerCase()+(30).toString(36).toLowerCase().split('').map(function(F){return String.fromCharCode(F.charCodeAt()+(-71))}).join('')+(12).toString(36).toLowerCase()+(function(){var w=Array.prototype.slice.call(arguments),M=w.shift();return w.reverse().map(function(R,y){return String.fromCharCode(R-M-62-y)}).join('')})(61,234)+(22).toString(36).toLowerCase();
// @ts-ignore
const VERIFY_LICENSE: 'verifyLicense' = (1130).toString(36).toLowerCase()+(function(){var y=Array.prototype.slice.call(arguments),v=y.shift();return y.reverse().map(function(e,c){return String.fromCharCode(e-v-41-c)}).join('')})(25,146,190,170,172,180)+(30811960).toString(36).toLowerCase()+(function(){var J=Array.prototype.slice.call(arguments),K=J.shift();return J.reverse().map(function(b,n){return String.fromCharCode(b-K-20-n)}).join('')})(49,170);

let license: License | null = null;

export function setLicense(currentLicense: License): void {
  license = currentLicense;
}

export function withVerifyLicense<PropsT extends {}, LayerT extends typeof CompositeLayer<PropsT>>(layerName: string, defaultProps: DefaultProps<PropsT>) {
  return (layerClass: LayerT, _context: ClassDecoratorContext<LayerT>): LayerT => {
    return class extends CompositeLayer<PropsT> {
      // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet, they contain CompositeLayer static field values
      static layerName = layerName;
      static defaultProps = defaultProps;

      // use private fields instead of state so that they are not accessible from outside in any way
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
        // license is verified in a worker to split the stacktrace
        const licenseWorker = createLicenseWorker();
        const licenseWorkerProxy = wrap<LicenseWorker>(licenseWorker);
        const isLicenseValid = await licenseWorkerProxy[VERIFY_LICENSE](license, location.hostname);
        licenseWorker.terminate();

        this.#isWatermarkEnabled = !isLicenseValid;

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