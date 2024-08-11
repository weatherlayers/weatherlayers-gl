import type { License } from 'weatherlayers-license/src/license.js';

export class LicenseWorker {
  verifyLicense(license: License | null, currentDomain: string): Promise<boolean>;
}