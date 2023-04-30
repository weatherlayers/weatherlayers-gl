import type { License } from './license.js';

export class LicenseWorker {
  verifyLicense(license: License | null, currentDomain: string): Promise<boolean>;
}