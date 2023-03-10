import {CompositeLayer} from '@deck.gl/core';
import {PathLayer, IconLayer} from '@deck.gl/layers';
import {CollisionFilterExtension, PathStyleExtension} from '@deck.gl/extensions';
import {initialBearing} from '../../../_utils/geodesy';
import {FrontTypeToColor, FrontTypeToAlternateColor, FrontTypeToIndex, iconAtlas, iconMapping} from './front-type.js';

const DEFAULT_FRONT_ICON_SIZE = 30;

const defaultProps = {
  data: {type: 'array', value: null, required: true},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},

  getPath: {type: 'function', required: true},
  getFrontType: {type: 'function', required: true},
  iconSize: {type: 'number', value: DEFAULT_FRONT_ICON_SIZE},
};

class FrontCompositeLayer extends CompositeLayer {
  renderLayers() {
    const {data, getPath, getFrontType, iconSize} = this.props;
    if (!data) {
      return [];
    }

    const frontPoints = data.map(d => {
      const path = getPath(d);

      return new Array((path.length - 1) * 9).fill(undefined).map((_, i) => {
        const j = Math.floor(i / 9);
        const k = i % 9;
        const currentPoint = path[j];
        const nextPoint = path[j + 1];
        const diffPoint = [nextPoint[0] - currentPoint[0], nextPoint[1] - currentPoint[1]];
        const point = [currentPoint[0] + diffPoint[0] / 9 * (k + 0.5), currentPoint[1] + diffPoint[1] / 9 * (k + 0.5)];
        const direction = 90 - initialBearing(currentPoint, nextPoint);
        const priority = k % 9 === 4 ? 2 : k % 3 === 1 ? 1 : 0;
  
        return { d, point, direction, priority };
      });
    }).flat();

    return [
      new PathLayer(this.getSubLayerProps({
        id: 'path',
        data: data,
        getPath: getPath,
        getColor: d => FrontTypeToColor[getFrontType(d)],
        getWidth: 2,
        widthUnits: 'pixels',
      })),
      new PathLayer(this.getSubLayerProps({
        id: 'path-alternate',
        data: data.filter(d => FrontTypeToAlternateColor[getFrontType(d)]),
        getPath: getPath,
        getColor: d => FrontTypeToAlternateColor[getFrontType(d)],
        getWidth: 2,
        widthUnits: 'pixels',

        extensions: [new PathStyleExtension({dash: true, highPrecisionDash: true})],
        getDashArray: [DEFAULT_FRONT_ICON_SIZE, DEFAULT_FRONT_ICON_SIZE],
      })),
      new IconLayer(this.getSubLayerProps({
        id: 'icon',
        data: frontPoints,
        getPosition: d => d.point,
        getIcon: d => FrontTypeToIndex[getFrontType(d.d)],
        getSize: iconSize,
        getColor: d => FrontTypeToColor[getFrontType(d.d)],
        getAngle: d => d.direction,
        iconAtlas,
        iconMapping,
        billboard: false,

        extensions: [new CollisionFilterExtension()],
        collisionTestProps: {sizeScale: 3},
        getCollisionPriority: d => d.priority,
      })),
    ];
  }
}

FrontCompositeLayer.layerName = 'FrontCompositeLayer';
FrontCompositeLayer.defaultProps = defaultProps;

export {FrontCompositeLayer};