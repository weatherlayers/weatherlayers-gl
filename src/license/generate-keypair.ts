import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {program, Option} from 'commander';
import clc from 'cli-color';
import {generateKeypair} from './license.js';

interface Options {
  privateKeyFile: string;
  publicKeyFile: string;
}

async function main(options: Options): Promise<void> {
  if (fs.existsSync(options.privateKeyFile)) {
    console.log(clc.red(`Private key at ${options.privateKeyFile} already exists.`));
    return;
  }
  if (fs.existsSync(options.publicKeyFile)) {
    console.log(clc.red(`Public key at ${options.publicKeyFile} already exists.`));
    return;
  }

  // generate keypair
  const {privateKeyJwk, publicKeyRaw} = await generateKeypair(webcrypto);

  // export private key
  fs.writeFileSync(options.privateKeyFile, JSON.stringify(privateKeyJwk, undefined, 2));
  console.log(`Exported private key to ${options.privateKeyFile}:`)
  console.log(clc.blackBright(JSON.stringify(privateKeyJwk, undefined, 2)));
  console.log();
  
  // export public key
  fs.writeFileSync(options.publicKeyFile, publicKeyRaw);
  console.log(`Exported public key to ${options.publicKeyFile}:`);
  console.log(clc.blackBright(publicKeyRaw));
  console.log();
}

program
  .addOption(new Option('--privateKeyFile <private-key-file>').env('LICENSE_PRIVATE_KEY_FILE'))
  .addOption(new Option('--publicKeyFile <public-key-file>').env('LICENSE_PUBLIC_KEY_FILE'));
program.parse();
main(program.opts());