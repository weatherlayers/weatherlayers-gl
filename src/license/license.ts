import stringify from 'json-stable-stringify';

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
  return Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
}

async function verifyLicenseSignature(crypto: Crypto, publicKeyRaw: string, content: LicenseContent, signature: string): Promise<boolean> {
  if (!crypto.subtle) {
    return false;
  }

  const publicKey = await crypto.subtle.importKey(
    'raw',
    bufferFromBase64(publicKeyRaw),
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['verify']
  );

  return crypto.subtle.verify(
    { name: 'ECDSA', hash: { name: 'SHA-384' } },
    publicKey,
    bufferFromBase64(signature),
    new TextEncoder().encode(stringify(content))
  );
}

function verifyLicenseDatetime(content: LicenseContent, packageDatetime: string): boolean {
  const supportValidUntil = new Date(content.created);
  supportValidUntil.setFullYear(supportValidUntil.getFullYear() + 1);
  return supportValidUntil.toISOString() >= packageDatetime;
}

function verifyLicenseDomain(content: LicenseContent, currentDomain: string): boolean {
  return (
    !content.domains ||
    content.domains.length === 0 ||
    content.domains.some(domain => domain === '*') ||
    content.domains.some(domain => currentDomain === domain) ||
    content.domains.some(domain => currentDomain.endsWith('.' + domain)) ||
    ['localhost', '127.0.0.1', '::1'].some(domain => currentDomain === domain)
  );
}

function getInvalidLicenseMessage(partialMessage: string): string {
  return `${partialMessage} A valid license file is required to use the library in production. Contact support@weatherlayers.com for details.`;
}

function getInvalidLicenseResult(message: string): LicenseResult {
  return { isValid: false, message };
}

function getValidLicenseResult(): LicenseResult {
  return { isValid: true };
}

export async function verifyLicense(crypto: Crypto, publicKeyRaw: string, license: License | null, packageDatetime: string, currentDomain: string): Promise<LicenseResult> {
  if (!license) {
    return getInvalidLicenseResult(getInvalidLicenseMessage('WeatherLayers GL license file is missing.'));
  }

  const { content, signature } = license;

  if (!await verifyLicenseSignature(crypto, publicKeyRaw, content, signature)) {
    return getInvalidLicenseResult(getInvalidLicenseMessage('WeatherLayers GL license file can\'t be verified.'));
  }

  if (!verifyLicenseDatetime(content, packageDatetime)) {
    return getInvalidLicenseResult(getInvalidLicenseMessage('WeatherLayers GL license file support has expired.'));
  }

  if (!verifyLicenseDomain(content, currentDomain)) {
    return getInvalidLicenseResult(getInvalidLicenseMessage('WeatherLayers GL license file is used on an unauthorised domain.'));
  }

  return getValidLicenseResult();
}