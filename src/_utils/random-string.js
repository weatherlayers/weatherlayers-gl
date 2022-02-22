const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomString(length = 20) {
  return new Array(length).fill().map(() => CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))).join('');
}