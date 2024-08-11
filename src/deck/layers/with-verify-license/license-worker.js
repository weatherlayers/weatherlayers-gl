// TODO: fix Rollup build config to use TS instead of JS
import { expose, transfer } from 'comlink';
import { verifyLicenseMain } from './license-worker-main.js';

/** @typedef {import('weatherlayers-license/src/license.js').License} License */

expose({
  /**
   * @param {License | null} data
   * @param {string} currentDomain
   * @returns {Promise<boolean>}
   */
  verifyLicense(license, currentDomain) {
    return verifyLicenseMain(license, currentDomain);
  }
});