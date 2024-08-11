import { DATETIME } from '../../../client/_utils/build.js';
import { verifyLicense } from 'weatherlayers-license/src/license.js';
import type { License } from 'weatherlayers-license/src/license.js';

// keypair generated at 2023-03-27 21:36
const publicKeyRaw = 'BB8crVfPRTepHZWydXQMymaEETZzVkYylbuIxPkXyk8jnQrx5QBa5qWV/c8JdXoLcLhlRETQ73Heaz/aIngMioLUyiX6EE9HzDbuiUw84V49ETANUiJcyZuzEMZ/2OumpA==';

export async function verifyLicenseMain(license: License | null, currentDomain: string): Promise<boolean> {
  const licenseResult = await verifyLicense(crypto, publicKeyRaw, license, DATETIME, currentDomain);

  if (licenseResult.message) {
    if (!licenseResult.isValid) {
      console.warn(licenseResult.message);
    } else {
      console.info(licenseResult.message);
    }
  }
  
  return licenseResult.isValid;
}