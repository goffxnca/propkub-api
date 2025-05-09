import { randomBytes } from 'crypto';

export function generatePassword(length = 8): string {
  return randomBytes(length).toString('base64').slice(0, length);
}
