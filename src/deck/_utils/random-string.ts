const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomString(length: number = 20) {
  return new Array(length).fill(undefined).map(() => CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))).join('');
}