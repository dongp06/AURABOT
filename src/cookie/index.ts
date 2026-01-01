import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface CookieStore {
  youtube?: string;
  [key: string]: string | undefined;
}

declare global {
  // eslint-disable-next-line no-var
  var cookie: CookieStore;
}

const COOKIE_DIR = path.resolve(__dirname, './');

const loadCookie = (name: string): string | undefined => {
  const cookiePath = path.join(COOKIE_DIR, `${name}.txt`);
  if (!fs.existsSync(cookiePath)) {
    logger.warn(`Cookie file not found: ${cookiePath}`);
    return undefined;
  }

  try {
    const cookieContent = fs.readFileSync(cookiePath, 'utf8').trim();
    return cookieContent || undefined;
  } catch (error) {
    logger.error(`Error reading cookie file ${name}:`, error);
    return undefined;
  }
};

export const initCookies = (): void => {
  global.cookie = {
    youtube: loadCookie('youtube')
  };

  logger.info('✅ Cookies initialized');
};
