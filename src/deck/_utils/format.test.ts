import assert from 'node:assert';
import test from 'node:test';

import {formatDirection} from './format.js';
import {DirectionType} from './direction-type.js';
import {DirectionFormat} from './direction-format.js';

const DELTA = 0.000001;

const REVERSE_CARDINALS = {
  'N': 'S',
  'E': 'W',
  'S': 'N',
  'W': 'E',
};

function reverseDirection(direction: string): string {
  return direction.split('').map(char => REVERSE_CARDINALS[char as keyof typeof REVERSE_CARDINALS]).join('');
}

test('formatDirection', () => {
  const rows = [
    [  0    + DELTA, 'N', 'N', 'N'],
    [ 11.25 - DELTA, 'N', 'N', 'N'],
    [ 11.25 + DELTA, 'N', 'N', 'NNE'],
    [ 22.5  - DELTA, 'N', 'N', 'NNE'],
    [ 22.5  + DELTA, 'N', 'NE', 'NNE'],
    [ 33.75 - DELTA, 'N', 'NE', 'NNE'],
    [ 33.75 + DELTA, 'N', 'NE', 'NE'],
    [ 45    - DELTA, 'N', 'NE', 'NE'],
    [ 45    + DELTA, 'E', 'NE', 'NE'],
    [ 56.25 - DELTA, 'E', 'NE', 'NE'],
    [ 56.25 + DELTA, 'E', 'NE', 'ENE'],
    [ 67.5  - DELTA, 'E', 'NE', 'ENE'],
    [ 67.5  + DELTA, 'E', 'E', 'ENE'],
    [ 78.75 - DELTA, 'E', 'E', 'ENE'],
    [ 78.75 + DELTA, 'E', 'E', 'E'],
    [ 90    - DELTA, 'E', 'E', 'E'],
    [ 90    + DELTA, 'E', 'E', 'E'],
    [101.25 - DELTA, 'E', 'E', 'E'],
    [101.25 + DELTA, 'E', 'E', 'ESE'],
    [112.5  - DELTA, 'E', 'E', 'ESE'],
    [112.5  + DELTA, 'E', 'SE', 'ESE'],
    [123.75 - DELTA, 'E', 'SE', 'ESE'],
    [123.75 + DELTA, 'E', 'SE', 'SE'],
    [135    - DELTA, 'E', 'SE', 'SE'],
    [135    + DELTA, 'S', 'SE', 'SE'],
    [146.25 - DELTA, 'S', 'SE', 'SE'],
    [146.25 + DELTA, 'S', 'SE', 'SSE'],
    [157.5  - DELTA, 'S', 'SE', 'SSE'],
    [157.5  + DELTA, 'S', 'S', 'SSE'],
    [168.75 - DELTA, 'S', 'S', 'SSE'],
    [168.75 + DELTA, 'S', 'S', 'S'],
    [180    - DELTA, 'S', 'S', 'S'],
    [180    + DELTA, 'S', 'S', 'S'],
    [191.25 - DELTA, 'S', 'S', 'S'],
    [191.25 + DELTA, 'S', 'S', 'SSW'],
    [202.5  - DELTA, 'S', 'S', 'SSW'],
    [202.5  + DELTA, 'S', 'SW', 'SSW'],
    [213.75 - DELTA, 'S', 'SW', 'SSW'],
    [213.75 + DELTA, 'S', 'SW', 'SW'],
    [225    - DELTA, 'S', 'SW', 'SW'],
    [225    + DELTA, 'W', 'SW', 'SW'],
    [236.25 - DELTA, 'W', 'SW', 'SW'],
    [236.25 + DELTA, 'W', 'SW', 'WSW'],
    [247.5  - DELTA, 'W', 'SW', 'WSW'],
    [247.5  + DELTA, 'W', 'W', 'WSW'],
    [258.75 - DELTA, 'W', 'W', 'WSW'],
    [258.75 + DELTA, 'W', 'W', 'W'],
    [270    - DELTA, 'W', 'W', 'W'],
    [270    + DELTA, 'W', 'W', 'W'],
    [281.25 - DELTA, 'W', 'W', 'W'],
    [281.25 + DELTA, 'W', 'W', 'WNW'],
    [292.5  - DELTA, 'W', 'W', 'WNW'],
    [292.5  + DELTA, 'W', 'NW', 'WNW'],
    [303.75 - DELTA, 'W', 'NW', 'WNW'],
    [303.75 + DELTA, 'W', 'NW', 'NW'],
    [315    - DELTA, 'W', 'NW', 'NW'],
    [315    + DELTA, 'N', 'NW', 'NW'],
    [326.25 - DELTA, 'N', 'NW', 'NW'],
    [326.25 + DELTA, 'N', 'NW', 'NNW'],
    [337.5  - DELTA, 'N', 'NW', 'NNW'],
    [337.5  + DELTA, 'N', 'N', 'NNW'],
    [348.75 - DELTA, 'N', 'N', 'NNW'],
    [348.75 + DELTA, 'N', 'N', 'N'],
    [360    - DELTA, 'N', 'N', 'N'],
    [360    + DELTA, 'N', 'N', 'N'],
  ] as [direction: number, expectedResultInwardCardinal: string, expectedResultInwardCardinal2: string, expectedResultInwardCardinal3: string][];
  for (const [direction, expectedResultInwardCardinal, expectedResultInwardCardinal2, expectedResultInwardCardinal3] of rows) {
    const resultInwardCardinal = formatDirection(direction, DirectionType.INWARD, DirectionFormat.CARDINAL);
    const resultOutwardCardinal = formatDirection(direction, DirectionType.OUTWARD, DirectionFormat.CARDINAL);
    const expectedResultOutwardCardinal = reverseDirection(expectedResultInwardCardinal);
    assert.equal(resultInwardCardinal, expectedResultInwardCardinal, `formatDirection(${direction}, ${DirectionFormat.CARDINAL}) was ${resultInwardCardinal}, but should be ${expectedResultInwardCardinal}`);
    assert.equal(resultOutwardCardinal, expectedResultOutwardCardinal, `formatDirection(${direction}, ${DirectionFormat.CARDINAL}) was ${resultOutwardCardinal}, but should be ${expectedResultInwardCardinal}`);

    const resultInwardCardinal2 = formatDirection(direction, DirectionType.INWARD, DirectionFormat.CARDINAL2);
    const resultOutwardCardinal2 = formatDirection(direction, DirectionType.OUTWARD, DirectionFormat.CARDINAL2);
    const expectedResultOutwardCardinal2 = reverseDirection(expectedResultInwardCardinal2);
    assert.equal(resultInwardCardinal2, expectedResultInwardCardinal2, `formatDirection(${direction}, ${DirectionFormat.CARDINAL2}) was ${resultInwardCardinal2}, but should be ${expectedResultInwardCardinal2}`);
    assert.equal(resultOutwardCardinal2, expectedResultOutwardCardinal2, `formatDirection(${direction}, ${DirectionFormat.CARDINAL2}) was ${resultOutwardCardinal2}, but should be ${expectedResultInwardCardinal2}`);

    const resultInwardCardinal3 = formatDirection(direction, DirectionType.INWARD, DirectionFormat.CARDINAL3);
    const resultOutwardCardinal3 = formatDirection(direction, DirectionType.OUTWARD, DirectionFormat.CARDINAL3);
    const expectedResultOutwardCardinal3 = reverseDirection(expectedResultInwardCardinal3);
    assert.equal(resultInwardCardinal3, expectedResultInwardCardinal3, `formatDirection(${direction}, ${DirectionFormat.CARDINAL3}) was ${resultInwardCardinal3}, but should be ${expectedResultInwardCardinal3}`);
    assert.equal(resultOutwardCardinal3, expectedResultOutwardCardinal3, `formatDirection(${direction}, ${DirectionFormat.CARDINAL3}) was ${resultOutwardCardinal3}, but should be ${expectedResultInwardCardinal3}`);
  }
});