import assert from 'node:assert';
import test from 'node:test';

import { formatDirection } from './format.js';
import { DirectionType } from './direction-type.js';
import { DirectionFormat } from './direction-format.js';

const DELTA = 0.000001;

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
  ] as [direction: number, expectedResultCardinal: string, expectedResultCardinal2: string, expectedResultCardinal3: string][];
  for (const [direction, expectedResultCardinal, expectedResultCardinal2, expectedResultCardinal3] of rows) {
    const resultCardinal = formatDirection(direction, DirectionType.TO, DirectionFormat.CARDINAL);
    assert.equal(resultCardinal, expectedResultCardinal, `formatDirection(${direction}, ${DirectionFormat.CARDINAL}) was ${resultCardinal}, but should be ${expectedResultCardinal}`);

    const resultCardinal2 = formatDirection(direction, DirectionType.TO, DirectionFormat.CARDINAL2);
    assert.equal(resultCardinal2, expectedResultCardinal2, `formatDirection(${direction}, ${DirectionFormat.CARDINAL2}) was ${resultCardinal2}, but should be ${expectedResultCardinal2}`);

    const resultCardinal3 = formatDirection(direction, DirectionType.TO, DirectionFormat.CARDINAL3);
    assert.equal(resultCardinal3, expectedResultCardinal3, `formatDirection(${direction}, ${DirectionFormat.CARDINAL3}) was ${resultCardinal3}, but should be ${expectedResultCardinal3}`);
  }
});