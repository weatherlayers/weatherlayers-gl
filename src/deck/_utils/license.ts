import type { License } from 'weatherlayers-license/src/license.js';

let license: License | null = null;

export function setLicense(currentLicense: any): void {
  if (typeof currentLicense.content !== 'object' || typeof currentLicense.signature !== 'string') {
    throw new Error('Invalid license');
  }
  license = currentLicense;
}

export function getLicense(): License | null {
  return license;
}