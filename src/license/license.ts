import stringify from 'json-stable-stringify';
import {CONTENT, SIGNATURE, SUBTLE, IMPORT_KEY, VERIFY, RAW, NAME, NAMED_CURVE, HASH, ECDSA, P_384, SHA_384, UINT8_ARRAY, FROM, ATOB, CHAR_CODE_AT, TEXT_ENCODER, ENCODE, DATE, GET_FULL_YEAR, SET_FULL_YEAR, TO_ISO_STRING, DOMAINS, LENGTH, ASTERISK, SOME, ENDS_WITH, DOT, LOCALHOST, LOCALHOST_IPV4, LOCALHOST_IPV6, IS_VALID, MESSAGE, LICENSE_MESSAGE_PREFIX, LICENSE_MESSAGE_SUFFIX, LICENSE_MESSAGE_MISSING, LICENSE_MESSAGE_CORRUPTED, LICENSE_MESSAGE_EXPIRED, LICENSE_MESSAGE_UNAUTHORISED, CONSOLE, WARN} from './license-build.js';

export enum LicenseType {
  NONCOMMERCIAL = 'noncommercial',
  PRODUCTION = 'production',
}

export interface LicenseContent {
  id: string;
  type: LicenseType,
  name: string;
  domains: string[];
  created: string;
}

export type License = { content: LicenseContent, signature: string };

export interface LicenseResult {
  isValid: boolean;
  message?: string;
}

export async function generateKeypair(crypto: Crypto): Promise<{ privateKeyJwk: JsonWebKey, publicKeyRaw: string }> {
  const {privateKey, publicKey} = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['sign', 'verify']
  );

  const privateKeyJwk = await crypto.subtle.exportKey('jwk', privateKey);
  const publicKeyRaw = Buffer.from(await crypto.subtle.exportKey('raw', publicKey)).toString('base64');
  return { privateKeyJwk, publicKeyRaw };
}

async function signLicenseContent(crypto: Crypto, privateKeyJwk: JsonWebKey, content: LicenseContent): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['sign']
  );

  const signature = Buffer.from(await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-384' },
    },
    privateKey,
    new TextEncoder().encode(stringify(content))
  )).toString('base64');

  return signature;
}

export async function generateLicense(crypto: Crypto, privateKeyJwk: JsonWebKey, id: string, type: LicenseType, name: string, domains: string[], created: string): Promise<License> {
  const content: LicenseContent = { id, type, name, domains, created };
  const signature = await signLicenseContent(crypto, privateKeyJwk, content);
  return { content, signature };
}

// code for both Node.js and browser follows

// Buffer.from(signature, 'base64')
// deprecated atob seems to be safe to use, no issues have been detected
function bufferFromBase64(base64String: string): ArrayBuffer {
  return globalThis[UINT8_ARRAY][FROM](globalThis[ATOB](base64String), c => c[CHAR_CODE_AT](0));
}

async function verifyLicenseSignature(crypto: Crypto, publicKeyRaw: string, content: LicenseContent, signature: string): Promise<boolean> {
  const publicKey = await crypto[SUBTLE][IMPORT_KEY](
    RAW,
    bufferFromBase64(publicKeyRaw),
    { [NAME]: ECDSA, [NAMED_CURVE]: P_384 },
    true,
    [VERIFY]
  );

  return crypto[SUBTLE][VERIFY](
    { [NAME]: ECDSA, [HASH]: { [NAME]: SHA_384 } },
    publicKey,
    bufferFromBase64(signature),
    new globalThis[TEXT_ENCODER]()[ENCODE](stringify(content))
  );
}

function verifyLicenseDatetime(content: LicenseContent, packageDatetime: string): boolean {
  const supportValidUntil = new globalThis[DATE](content.created);
  supportValidUntil[SET_FULL_YEAR](supportValidUntil[GET_FULL_YEAR]() + 1);
  return supportValidUntil[TO_ISO_STRING]() >= packageDatetime;
}

function verifyLicenseDomain(content: LicenseContent, currentDomain: string): boolean {
  return (
    !content[DOMAINS] ||
    content[DOMAINS][LENGTH] === 0 ||
    content[DOMAINS][SOME](domain => domain === ASTERISK) ||
    content[DOMAINS][SOME](domain => currentDomain === domain) ||
    content[DOMAINS][SOME](domain => currentDomain[ENDS_WITH](DOT + domain)) ||
    [LOCALHOST, LOCALHOST_IPV4, LOCALHOST_IPV6][SOME](domain => currentDomain === domain)
  );
}

function getLicenseMessage(partialMessage: string): string {
  return LICENSE_MESSAGE_PREFIX + partialMessage + LICENSE_MESSAGE_SUFFIX;
}

function getInvalidLicenseResult(partialMessage: string): LicenseResult {
  return { [IS_VALID]: false, [MESSAGE]: getLicenseMessage(partialMessage) };
}

function getValidLicenseResult(): LicenseResult {
  return { [IS_VALID]: true };
}

export async function verifyLicense(crypto: Crypto, publicKeyRaw: string, license: License | null, packageDatetime: string, currentDomain: string): Promise<LicenseResult> {
  if (!license) {
    return getInvalidLicenseResult(LICENSE_MESSAGE_MISSING);
  }

  const { [CONTENT]: content, [SIGNATURE]: signature } = license;

  if (!await verifyLicenseSignature(crypto, publicKeyRaw, content, signature)) {
    return getInvalidLicenseResult(LICENSE_MESSAGE_CORRUPTED);
  }

  if (!verifyLicenseDatetime(content, packageDatetime)) {
    return getInvalidLicenseResult(LICENSE_MESSAGE_EXPIRED);
  }

  if (!verifyLicenseDomain(content, currentDomain)) {
    return getInvalidLicenseResult(LICENSE_MESSAGE_UNAUTHORISED);
  }

  return getValidLicenseResult();
}

export async function verifyLicenseAndLog(crypto: Crypto, publicKeyRaw: string, license: License | null, packageDatetime: string, currentDomain: string): Promise<boolean> {
  const licenseResult = await verifyLicense(crypto, publicKeyRaw, license, packageDatetime, currentDomain);

  if (licenseResult[MESSAGE]) {
    globalThis[CONSOLE][WARN](licenseResult.message);
  }
  
  return licenseResult[IS_VALID];
}