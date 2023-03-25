import iconAtlas from './front-type.atlas.png';
import iconMapping from './front-type.mapping.json';

export enum FrontType {
  COLD = 'COLD',
  WARM = 'WARM',
  OCCLUDED = 'OCCLUDED',
  STATIONARY = 'STATIONARY',
}

// icon anchor needs to be in the non-transparent part of the icon, to workaround for CollisionFilterExtension flickering
// see https://github.com/visgl/deck.gl/pull/7679
// ->
// icon height = 35
// icon padding bottom = 3 (found experimentally, works best for rotated icons)
// total icon height = 38
export {iconAtlas, iconMapping};