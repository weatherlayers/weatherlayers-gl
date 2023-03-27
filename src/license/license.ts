import stringify from 'json-stable-stringify';
import {CONTENT, SIGNATURE, SUBTLE, IMPORT_KEY, VERIFY, RAW, NAME, NAMED_CURVE, HASH, ECDSA, P_384, SHA_384, UINT8_ARRAY, FROM, ATOB, CHAR_CODE_AT, TEXT_ENCODER, ENCODE, EXPIRES, DOMAINS, LENGTH, ASTERISK, SOME, ENDS_WITH, DOT, LOCALHOST, LOCALHOST_IPV4, LOCALHOST_IPV6} from './license-build.js';

export enum LicenseType {
  TRIAL = 'trial',
  PRODUCTION = 'production',
}

export interface LicenseContent {
  id: string;
  type: LicenseType,
  name: string;
  expires: string | undefined;
  domains: string[];
  nonCommercial: true | undefined;
  created: string;
}

export type License = { content: LicenseContent, signature: string };

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

export async function generateLicense(crypto: Crypto, privateKeyJwk: JsonWebKey, id: string, type: LicenseType, name: string, expires: string | undefined, domains: string[], nonCommercial: true | undefined, created: string): Promise<License> {
  const content: LicenseContent = { id, type, name, expires, domains, nonCommercial, created };
  const signature = await signLicenseContent(crypto, privateKeyJwk, content);
  return { content, signature };
}

// code for both Node.js and browser follows
// property keys are encoded by gnirts to harden against breaking the license

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

function verifyLicenseDate(content: LicenseContent, currentDate: string): boolean {
  return (
    !content[EXPIRES] ||
    currentDate <= content[EXPIRES]
  );
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

export async function verifyLicense(crypto: Crypto, publicKeyRaw: string, license: License | null, currentDate: string, currentDomain: string): Promise<boolean> {
  if (!license) {
    return false;
  }

  const {[CONTENT]: content, [SIGNATURE]: signature} = license;

  return (
    await verifyLicenseSignature(crypto, publicKeyRaw, content, signature) &&
    verifyLicenseDate(content, currentDate) &&
    verifyLicenseDomain(content, currentDomain)
  );
}