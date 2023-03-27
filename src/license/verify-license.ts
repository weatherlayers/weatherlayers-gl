import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {program, Option} from 'commander';
import clc from 'cli-color';
import {verifyLicense} from './license.js';
import type {License} from './license.js';

interface Options {
  publicKeyFile: string;
  licenseFile: string;
  domain: string;
}

async function main(options: Options): Promise<void> {
  // import public key
  const publicKeyRaw = fs.readFileSync(options.publicKeyFile, { encoding: 'utf-8' });
  console.log(`Imported public key from ${options.publicKeyFile}:`);
  console.log(clc.blackBright(publicKeyRaw));
  console.log();

  // import license
  const license: License = JSON.parse(fs.readFileSync(options.licenseFile, { encoding: 'utf-8' }));
  console.log(`Imported license from ${options.licenseFile}:`);
  console.log(clc.blackBright(JSON.stringify(license, undefined, 2)));
  console.log();

  // verify license
  const isLicenseValid = await verifyLicense(webcrypto as Crypto, publicKeyRaw, license, new Date().toISOString(), options.domain);
  console.log('License verification result:');
  console.log(isLicenseValid ? clc.green('VALID ✔') : clc.red('INVALID ✘'));
  console.log();
}

program
  .addOption(new Option('--publicKeyFile <public-key-file>').env('LICENSE_PUBLIC_KEY_FILE'))
  .addOption(new Option('--licenseFile <license-file>').env('LICENSE_FILE'))
  .addOption(new Option('--domain <domain>').makeOptionMandatory());
program.parse();
main(program.opts());