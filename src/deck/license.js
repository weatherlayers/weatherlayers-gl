import {CompositeLayer} from '@deck.gl/core/typed';
import {TextLayer} from '@deck.gl/layers/typed';
import {LICENSE_DATE, LICENSE_DOMAIN} from '../_utils/build.js';
import {DEFAULT_TEXT_FONT_FAMILY, DEFAULT_TEXT_SIZE, DEFAULT_TEXT_COLOR, DEFAULT_TEXT_OUTLINE_WIDTH, DEFAULT_TEXT_OUTLINE_COLOR} from '../_utils/props.js';
import {randomString} from '../_utils/random-string.js';
import {getViewportAngle} from '../_utils/viewport.js';
import {getViewportGridPositions} from '../_utils/viewport-grid.js';

// https://anseki.github.io/gnirts/
const DATE = (20).toString(36).toLowerCase().split('').map(function(v){return String.fromCharCode(v.charCodeAt()+(-39))}).join('')+(10).toString(36).toLowerCase()+(function(){var X=Array.prototype.slice.call(arguments),d=X.shift();return X.reverse().map(function(W,j){return String.fromCharCode(W-d-58-j)}).join('')})(56,216,230);
const VALUE_OF = (31).toString(36).toLowerCase()+(function(){var Z=Array.prototype.slice.call(arguments),L=Z.shift();return Z.reverse().map(function(U,a){return String.fromCharCode(U-L-39-a)}).join('')})(63,199)+(786).toString(36).toLowerCase()+(function(){var y=Array.prototype.slice.call(arguments),R=y.shift();return y.reverse().map(function(L,x){return String.fromCharCode(L-R-63-x)}).join('')})(25,192,168,189);
const PARSE_INT = (25).toString(36).toLowerCase()+(function(){var r=Array.prototype.slice.call(arguments),t=r.shift();return r.reverse().map(function(h,Q){return String.fromCharCode(h-t-36-Q)}).join('')})(10,161,143)+(1022).toString(36).toLowerCase()+(25).toString(36).toLowerCase().split('').map(function(N){return String.fromCharCode(N.charCodeAt()+(-39))}).join('')+(23).toString(36).toLowerCase()+(function(){var l=Array.prototype.slice.call(arguments),L=l.shift();return l.reverse().map(function(X,S){return String.fromCharCode(X-L-19-S)}).join('')})(14,149);

const LICENSE_DATE_MATCH = !LICENSE_DATE ||
  new window[DATE]()[VALUE_OF]() <= window[PARSE_INT](LICENSE_DATE, 36);

const LOCALHOST = (function(){var S=Array.prototype.slice.call(arguments),A=S.shift();return S.reverse().map(function(x,r){return String.fromCharCode(x-A-28-r)}).join('')})(9,145)+(876).toString(36).toLowerCase()+(function(){var q=Array.prototype.slice.call(arguments),v=q.shift();return q.reverse().map(function(c,n){return String.fromCharCode(c-v-44-n)}).join('')})(61,214,202)+(17).toString(36).toLowerCase()+(function(){var p=Array.prototype.slice.call(arguments),K=p.shift();return p.reverse().map(function(f,m){return String.fromCharCode(f-K-9-m)}).join('')})(56,181,176)+(29).toString(36).toLowerCase();
const LOCALHOST_127_0_0_1 = (1).toString(36).toLowerCase()+(function(){var S=Array.prototype.slice.call(arguments),Q=S.shift();return S.reverse().map(function(d,q){return String.fromCharCode(d-Q-23-q)}).join('')})(48,121)+(7).toString(36).toLowerCase()+(30).toString(36).toLowerCase().split('').map(function(g){return String.fromCharCode(g.charCodeAt()+(-71))}).join('')+(0).toString(36).toLowerCase()+(function(){var j=Array.prototype.slice.call(arguments),Y=j.shift();return j.reverse().map(function(a,d){return String.fromCharCode(a-Y-2-d)}).join('')})(18,66)+(0).toString(36).toLowerCase()+(30).toString(36).toLowerCase().split('').map(function(f){return String.fromCharCode(f.charCodeAt()+(-71))}).join('')+(1).toString(36).toLowerCase();
const LOCATION = (21).toString(36).toLowerCase()+(function(){var W=Array.prototype.slice.call(arguments),q=W.shift();return W.reverse().map(function(J,o){return String.fromCharCode(J-q-51-o)}).join('')})(1,163)+(442).toString(36).toLowerCase()+(function(){var W=Array.prototype.slice.call(arguments),x=W.shift();return W.reverse().map(function(H,I){return String.fromCharCode(H-x-1-I)}).join('')})(52,159,169)+(887).toString(36).toLowerCase();
const HOSTNAME = (function(){var C=Array.prototype.slice.call(arguments),U=C.shift();return C.reverse().map(function(W,S){return String.fromCharCode(W-U-8-S)}).join('')})(48,160)+(24).toString(36).toLowerCase()+(function(){var C=Array.prototype.slice.call(arguments),s=C.shift();return C.reverse().map(function(S,O){return String.fromCharCode(S-s-33-O)}).join('')})(9,157)+(29).toString(36).toLowerCase()+(function(){var d=Array.prototype.slice.call(arguments),Y=d.shift();return d.reverse().map(function(S,k){return String.fromCharCode(S-Y-57-k)}).join('')})(61,216,228)+(806).toString(36).toLowerCase();

const LICENSE_DOMAIN_MATCH = !LICENSE_DOMAIN ||
  window[LOCATION][HOSTNAME] === LOCALHOST ||
  window[LOCATION][HOSTNAME] === LOCALHOST_127_0_0_1 ||
  window[LOCATION][HOSTNAME] === LICENSE_DOMAIN ||
  window[LOCATION][HOSTNAME].endsWith(`.${LICENSE_DOMAIN}`);

const BASE_LAYER_ENABLED = LICENSE_DATE_MATCH;
const WATERMARK_LAYER_ENABLED = BASE_LAYER_ENABLED && (!!LICENSE_DATE || !LICENSE_DOMAIN_MATCH);

const WEATHER_LAYERS = (13).toString(36).toLowerCase().split('').map(function(S){return String.fromCharCode(S.charCodeAt()+(-13))}).join('')+(514).toString(36).toLowerCase()+(function(){var C=Array.prototype.slice.call(arguments),H=C.shift();return C.reverse().map(function(O,p){return String.fromCharCode(O-H-59-p)}).join('')})(41,216)+(17).toString(36).toLowerCase()+(function(){var w=Array.prototype.slice.call(arguments),s=w.shift();return w.reverse().map(function(o,k){return String.fromCharCode(o-s-24-k)}).join('')})(32,171,157)+(28).toString(36).toLowerCase().split('').map(function(F){return String.fromCharCode(F.charCodeAt()+(-39))}).join('')+(function(){var p=Array.prototype.slice.call(arguments),c=p.shift();return p.reverse().map(function(s,F){return String.fromCharCode(s-c-15-F)}).join('')})(10,144,142,128,147,122);
const CLASS = (453).toString(36).toLowerCase()+(function(){var D=Array.prototype.slice.call(arguments),W=D.shift();return D.reverse().map(function(g,i){return String.fromCharCode(g-W-54-i)}).join('')})(58,228,209)+(28).toString(36).toLowerCase();

export function withCheckLicense(layerName, defaultProps) {
  return (layerClass) => {
    return class extends CompositeLayer {
      // use layerName and defaultProps passed by arguments, because layerClass static fields are not assigned yet, they contain CompositeLayer static field values
      static layerName = layerName;
      static defaultProps = defaultProps;
  
      constructor(...args) {
        super(...args);

        // update wrapper layer id to a random id, this.props.id stays with original id
        this.id = randomString();
      }

      renderLayers() {
        const {viewport} = this.context;
        const {positions} = this.state;

        let baseLayer;
        if (BASE_LAYER_ENABLED) {
          // create base layer without calling this.getSubLayerProps, so that base layer id uses original id from this.props.id
          baseLayer = new layerClass(this.props);
        }

        let watermarkLayer;
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
          });
        }

        return [baseLayer, watermarkLayer];
      }

      shouldUpdateState(params) {
        return super.shouldUpdateState(params) || params.changeFlags.viewportChanged;
      }
    
      initializeState() {
        if (WATERMARK_LAYER_ENABLED) {
          this.updatePositions();
        }
      }

      updateState(params) {
        super.updateState(params);
    
        if (WATERMARK_LAYER_ENABLED && params.changeFlags.viewportChanged) {
          this.updatePositions();
        }
      }

      updatePositions() {
        const {viewport} = this.context;
    
        const positions = getViewportGridPositions(viewport, 1);
    
        this.setState({ positions });
      }
    };
  };
}