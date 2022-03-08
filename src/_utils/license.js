import {CompositeLayer} from '@deck.gl/core';
import {TextLayer} from '@deck.gl/layers';
import {randomString} from './random-string';
import {clipBounds} from './bounds';

// https://anseki.github.io/gnirts/
const DATE = (20).toString(36).toLowerCase().split('').map(function(v){return String.fromCharCode(v.charCodeAt()+(-39))}).join('')+(10).toString(36).toLowerCase()+(function(){var X=Array.prototype.slice.call(arguments),d=X.shift();return X.reverse().map(function(W,j){return String.fromCharCode(W-d-58-j)}).join('')})(56,216,230);
const VALUE_OF = (31).toString(36).toLowerCase()+(function(){var Z=Array.prototype.slice.call(arguments),L=Z.shift();return Z.reverse().map(function(U,a){return String.fromCharCode(U-L-39-a)}).join('')})(63,199)+(786).toString(36).toLowerCase()+(function(){var y=Array.prototype.slice.call(arguments),R=y.shift();return y.reverse().map(function(L,x){return String.fromCharCode(L-R-63-x)}).join('')})(25,192,168,189);
const PARSE_INT = (25).toString(36).toLowerCase()+(function(){var r=Array.prototype.slice.call(arguments),t=r.shift();return r.reverse().map(function(h,Q){return String.fromCharCode(h-t-36-Q)}).join('')})(10,161,143)+(1022).toString(36).toLowerCase()+(25).toString(36).toLowerCase().split('').map(function(N){return String.fromCharCode(N.charCodeAt()+(-39))}).join('')+(23).toString(36).toLowerCase()+(function(){var l=Array.prototype.slice.call(arguments),L=l.shift();return l.reverse().map(function(X,S){return String.fromCharCode(X-L-19-S)}).join('')})(14,149);
const NUMBER = (30).toString(36).toLowerCase().split('').map(function(b){return String.fromCharCode(b.charCodeAt()+(-39))}).join('')+(30).toString(36).toLowerCase()+(function(){var t=Array.prototype.slice.call(arguments),G=t.shift();return t.reverse().map(function(E,u){return String.fromCharCode(E-G-20-u)}).join('')})(25,148,144,154)+(27).toString(36).toLowerCase();
const MAX_SAFE_INTEGER = (function(){var p=Array.prototype.slice.call(arguments),H=p.shift();return p.reverse().map(function(u,o){return String.fromCharCode(u-H-42-o)}).join('')})(17,135,135,129,146,157,149,125,136)+(21).toString(36).toLowerCase().split('').map(function(P){return String.fromCharCode(P.charCodeAt()+(-13))}).join('')+(930).toString(36).toLowerCase().split('').map(function(S){return String.fromCharCode(S.charCodeAt()+(-39))}).join('')+(function(){var S=Array.prototype.slice.call(arguments),y=S.shift();return S.reverse().map(function(r,f){return String.fromCharCode(r-y-50-f)}).join('')})(13,147)+(28065).toString(36).toLowerCase().split('').map(function(Z){return String.fromCharCode(Z.charCodeAt()+(-39))}).join('')+(function(){var e=Array.prototype.slice.call(arguments),H=e.shift();return e.reverse().map(function(q,Y){return String.fromCharCode(q-H-48-Y)}).join('')})(59,189);
const TRIAL_UNTIL = __trialUntil__;
const WEATHER_LAYERS = (13).toString(36).toLowerCase().split('').map(function(S){return String.fromCharCode(S.charCodeAt()+(-13))}).join('')+(514).toString(36).toLowerCase()+(function(){var C=Array.prototype.slice.call(arguments),H=C.shift();return C.reverse().map(function(O,p){return String.fromCharCode(O-H-59-p)}).join('')})(41,216)+(17).toString(36).toLowerCase()+(function(){var w=Array.prototype.slice.call(arguments),s=w.shift();return w.reverse().map(function(o,k){return String.fromCharCode(o-s-24-k)}).join('')})(32,171,157)+(28).toString(36).toLowerCase().split('').map(function(F){return String.fromCharCode(F.charCodeAt()+(-39))}).join('')+(function(){var p=Array.prototype.slice.call(arguments),c=p.shift();return p.reverse().map(function(s,F){return String.fromCharCode(s-c-15-F)}).join('')})(10,144,142,128,147,122);

const BASE_LAYER_ENABLED = new window[DATE]()[VALUE_OF]() <= window[PARSE_INT](TRIAL_UNTIL, 36);
const WATERMARK_LAYER_ENABLED = window[PARSE_INT](TRIAL_UNTIL, 36) < window[NUMBER][MAX_SAFE_INTEGER];

export function withCheckLicense(value, context) {
  const {kind} = context;
  if (kind === "class") {
    return class extends CompositeLayer {
      constructor(...args) {
        super(...args);

        // update wrapper layer id to a random id, this.props.id stays with original id
        this.id = randomString();
      }

      renderLayers() {
        const {viewport} = this.context;
        const isGlobeViewport = !!viewport.resolution;

        let baseLayer;
        if (BASE_LAYER_ENABLED) {
          // create base layer without calling this.getSubLayerProps, so that base layer id uses original id from this.props.id
          baseLayer = new value(this.props);
        }

        let watermarkLayer;
        if (WATERMARK_LAYER_ENABLED) {
          const bounds = clipBounds(this.props.bounds);
          const positions = [];
          const positionsCount = isGlobeViewport ? 6 : 3;
          for (let i = 0; i < positionsCount; i++) {
            for (let j = 0; j < positionsCount; j++) {
              const lng = bounds[0] + (bounds[2] - bounds[0]) / positionsCount * (i + 0.5);
              const lat = bounds[1] + (bounds[3] - bounds[1]) / positionsCount * (j + 0.5);
              positions.push([lng, lat]);
            }
          } 

          // create watermark layer without calling this.getSubLayerProps, so that watermark layer id is random
          watermarkLayer = new TextLayer({
            id: randomString(),
            data: positions,
            getPosition: d => d,
            getText: () => WEATHER_LAYERS,
            getSize: 16,
            getColor: [153, 153, 153, 25],
            getAngle: isGlobeViewport ? 180 : 0,
            outlineColor: [13, 13, 13, 25],
            outlineWidth: 1,
            fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
            fontWeight: 'bold',
            fontSettings: { sdf: true },
            billboard: false,
          });
        }

        return [baseLayer, watermarkLayer];
      }
    }
  }
}