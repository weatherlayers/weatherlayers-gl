import { CompositeLayer, CompositeLayerProps } from '@deck.gl/core';
import type { Position, DefaultProps, UpdateParameters, LayersList } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import type { TextLayerProps } from '@deck.gl/layers';
import { wrap } from 'comlink';
import { DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR } from '../_utils/props.js';
import { hashCodeString } from '../_utils/hashcode.js';
import { getViewportAngle } from '../_utils/viewport.js';
import { getViewportGridPositions } from '../_utils/viewport-grid.js';
import createLicenseWorker from 'worker!../license/license-worker.js';
import { LicenseWorker } from '../license/license-worker.js';
import type { License } from 'weatherlayers-license/src/license.js';

// https://anseki.github.io/gnirts/
// @ts-ignore
const WEATHER_LAYERS_COM: 'WeatherLayers.com' = (13).toString(36).toLowerCase().split('').map(function(G){return String.fromCharCode(G.charCodeAt()+(-13))}).join('')+(14).toString(36).toLowerCase()+(function(){var H=Array.prototype.slice.call(arguments),u=H.shift();return H.reverse().map(function(E,h){return String.fromCharCode(E-u-12-h)}).join('')})(55,184,164)+(17).toString(36).toLowerCase()+(function(){var r=Array.prototype.slice.call(arguments),e=r.shift();return r.reverse().map(function(G,K){return String.fromCharCode(G-e-54-K)}).join('')})(5,159,137,174,160)+(1605448).toString(36).toLowerCase()+(30).toString(36).toLowerCase().split('').map(function(F){return String.fromCharCode(F.charCodeAt()+(-71))}).join('')+(12).toString(36).toLowerCase()+(function(){var w=Array.prototype.slice.call(arguments),M=w.shift();return w.reverse().map(function(R,y){return String.fromCharCode(R-M-62-y)}).join('')})(61,234)+(22).toString(36).toLowerCase();
// @ts-ignore
const VERIFY_LICENSE: 'verifyLicense' = (1130).toString(36).toLowerCase()+(function(){var y=Array.prototype.slice.call(arguments),v=y.shift();return y.reverse().map(function(e,c){return String.fromCharCode(e-v-41-c)}).join('')})(25,146,190,170,172,180)+(30811960).toString(36).toLowerCase()+(function(){var J=Array.prototype.slice.call(arguments),K=J.shift();return J.reverse().map(function(b,n){return String.fromCharCode(b-K-20-n)}).join('')})(49,170);
// @ts-ignore
const LOCATION: 'location' = (function(){var o=Array.prototype.slice.call(arguments),y=o.shift();return o.reverse().map(function(k,l){return String.fromCharCode(k-y-5-l)}).join('')})(48,161)+(876).toString(36).toLowerCase()+(function(){var m=Array.prototype.slice.call(arguments),k=m.shift();return m.reverse().map(function(N,D){return String.fromCharCode(N-k-31-D)}).join('')})(52,190,200,180)+(24).toString(36).toLowerCase()+(function(){var s=Array.prototype.slice.call(arguments),r=s.shift();return s.reverse().map(function(M,y){return String.fromCharCode(M-r-34-y)}).join('')})(28,172);
// @ts-ignore
const HOSTNAME: 'hostname' = (17).toString(36).toLowerCase()+(function(){var u=Array.prototype.slice.call(arguments),y=u.shift();return u.reverse().map(function(o,V){return String.fromCharCode(o-y-61-V)}).join('')})(25,199,204,202,197)+(10).toString(36).toLowerCase()+(function(){var Z=Array.prototype.slice.call(arguments),O=Z.shift();return Z.reverse().map(function(F,T){return String.fromCharCode(F-O-49-T)}).join('')})(34,185,192);

const licenseWorkerProxy = wrap<LicenseWorker>(createLicenseWorker());

let license: License | null = null;

export function setLicense(currentLicense: License): void {
  license = currentLicense;
}

export function withVerifyLicense<PropsT extends {}, LayerT extends typeof CompositeLayer<PropsT>>(layerName: string, defaultProps: DefaultProps<PropsT>) {
  return (layerClass: LayerT, _context: ClassDecoratorContext<LayerT>): LayerT => {
    // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet
    // otherwise deck.gl logs a warning, see https://github.com/visgl/deck.gl/pull/7813
    layerClass.layerName = layerName;
    layerClass.defaultProps = defaultProps;

    return class extends CompositeLayer<PropsT> {
      // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet
      static layerName = layerName;
      static defaultProps = defaultProps;

      // use private fields instead of state so that they are not accessible from outside in any way
      #isWatermarkEnabled = false;
      #watermarkPositions: GeoJSON.Position[] = [];
  
      constructor(...propObjects: Partial<PropsT & CompositeLayerProps>[]) {
        super(...propObjects);

        // overwrite the wrapper layer id, so that the original layer can stay with the original id
        this.id = hashCodeString(`${this.id}-wrapper`);
      }

      renderLayers(): LayersList {
        const { viewport } = this.context;
        // create the base layer without calling this.getSubLayerProps, so that the base layer id can stay with the original id
        // @ts-ignore
        const baseLayer: CompositeLayer<PropsT> = new layerClass(this.props);

        let watermarkLayer: TextLayer<Position> | null = null;
        if (this.#isWatermarkEnabled) {
          // create the watermark layer without calling this.getSubLayerProps, so that the watermark layer id is not created from the wrapper layer id
          watermarkLayer = new TextLayer({
            id: hashCodeString(`${this.id}-watermark`),
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
        const isLicenseValid = await licenseWorkerProxy[VERIFY_LICENSE](license, globalThis[LOCATION][HOSTNAME]);

        this.#isWatermarkEnabled = !isLicenseValid;

        this.#updateWatermarkPositions();
      }

      #updateWatermarkPositions(): void {
        const { viewport } = this.context;
    
        if (this.#isWatermarkEnabled) {
          this.#watermarkPositions = getViewportGridPositions(viewport, 1);
      
          // trigger refresh after updating a private field
          this.setState({});
        }
      }
    } as unknown as LayerT;
  };
}