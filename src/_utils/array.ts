// from https://jsitor.com/osoTOcSoig
export function findLastIndex<T>(array: T[], callback: (item: T, index: number, array: T[]) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (callback.call(array, array[i], i, array)) return i;
  }
  return -1;
}