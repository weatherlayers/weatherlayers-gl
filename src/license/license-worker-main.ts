import {DATETIME} from '../_utils/build.js';
import {verifyLicenseAndLog} from './license.js';
import type {License} from './license.js';

// keypair generated at 2023-03-27 21:36
const publicKeyRaw = 'BB8crVfPRTepHZWydXQMymaEETZzVkYylbuIxPkXyk8jnQrx5QBa5qWV/c8JdXoLcLhlRETQ73Heaz/aIngMioLUyiX6EE9HzDbuiUw84V49ETANUiJcyZuzEMZ/2OumpA==';

export function verifyLicenseMain(license: License | null, currentDomain: string): Promise<boolean> {
  return verifyLicenseAndLog(crypto, publicKeyRaw, license, DATETIME, currentDomain);
}