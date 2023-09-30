// see https://stackoverflow.com/a/8831937
export function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
      let chr = value.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function hashCodeString(value: string): string {
  return (Math.abs(hashCode(value)) * 1000).toString(36);
}
