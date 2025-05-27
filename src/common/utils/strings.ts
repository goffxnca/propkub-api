import { randomBytes } from 'crypto';

export function generatePassword(length = 8): string {
  return randomBytes(length).toString('base64').slice(0, length);
}

export function truncEmail(email: string): string {
  if (!email) return '';
  const atIndex = email.indexOf('@');
  if (atIndex <= 5) {
    return `${email.substring(0, 1)}xxx@${email.split('@')[1]}`;
  }
  return `${email.substring(0, 5)}xxx@${email.split('@')[1]}`;
}

export function truncToken(token: string): string {
  if (!token) return '';
  return `${token.substring(0, 8)}...`;
}

export function getUnixEpochTime(): number {
  return Date.now();
}
