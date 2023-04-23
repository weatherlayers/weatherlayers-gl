import assert from 'node:assert';
import test from 'node:test';

import { interpolateDatetime, getDatetimeWeight } from './datetime.js';
import type { DatetimeISOString } from './datetime.js';

test('interpolateDatetime', () => {
  const rows = [
    ['2000-01-01T00:00:00.000Z', null,                       0,   '2000-01-01T00:00:00.000Z'],
    ['2000-01-01T00:00:00.000Z', null,                       1,   new Error('Invalid state')],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', -1,  '2000-01-01T00:00:00.000Z'],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', 0,   '2000-01-01T00:00:00.000Z'],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', 0.5, '2000-01-01T06:00:00.000Z'],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', 1,   '2000-01-01T12:00:00.000Z'],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', 2,   '2000-01-01T12:00:00.000Z'],
  ] as [start: DatetimeISOString, end: DatetimeISOString | null, weight: number, expectedResult: DatetimeISOString | Error][];
  for (const [start, end, weight, expectedResult] of rows) {
    if (expectedResult instanceof Error) {
      assert.throws(() => interpolateDatetime(start, end, weight), expectedResult);
    } else {
      const result = interpolateDatetime(start, end, weight);
      assert.deepStrictEqual(result, expectedResult, `interpolateDatetime(${start}, ${end}, ${weight}) was ${result}, but should be ${expectedResult}`);
    }
  }
});

test('getDatetimeWeight', () => {
  const rows = [
    ['2000-01-01T00:00:00.000Z', null,                       '2000-01-01T00:00:00.000Z', 0],
    ['2000-01-01T00:00:00.000Z', null,                       '2000-01-01T12:00:00.000Z', new Error('Invalid state')],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', '2000-01-01T00:00:00.000Z', 0],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', '2000-01-01T06:00:00.000Z', 0.5],
    ['2000-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', '2000-01-01T12:00:00.000Z', 1],
  ] as [start: DatetimeISOString, end: DatetimeISOString | null, middle: DatetimeISOString, expectedResult: number | Error][];
  for (const [start, end, middle, expectedResult] of rows) {
    if (expectedResult instanceof Error) {
      assert.throws(() => getDatetimeWeight(start, end, middle), expectedResult);
    } else {
      const result = getDatetimeWeight(start, end, middle);
      assert.deepStrictEqual(result, expectedResult, `getDatetimeWeight(${start}, ${end}, ${middle}) was ${result}, but should be ${expectedResult}`);
    }
  }
});