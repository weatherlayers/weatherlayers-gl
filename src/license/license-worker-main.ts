import { DATETIME } from '../_utils/build.js';
import { verifyLicense } from './license.js';
import type { License } from './license.js';

// keypair generated at 2023-03-27 21:36
const publicKeyRaw = 'BB8crVfPRTepHZWydXQMymaEETZzVkYylbuIxPkXyk8jnQrx5QBa5qWV/c8JdXoLcLhlRETQ73Heaz/aIngMioLUyiX6EE9HzDbuiUw84V49ETANUiJcyZuzEMZ/2OumpA==';

export async function verifyLicenseMain(license: License | null, currentDomain: string): Promise<boolean> {
  const licenseResult = await verifyLicense(crypto, publicKeyRaw, license, DATETIME, currentDomain);

  if (licenseResult.message) {
    console.warn(licenseResult.message);
  }
  
  return licenseResult.isValid;
}