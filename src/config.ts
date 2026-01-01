import fs from 'fs';
import path from 'path';
import { ApiOptions } from '../types';
import { logger } from './utils/logger';

interface OwnerNoPrefixConfig {
  all?: boolean;
  list?: string[];
}

interface BotConfig {
  bot: {
    prefix: string;
    name: string;
  };
  paths: {
    appstate: string;
    commands: string;
  };
  api: ApiOptions;
  externalApi?: {
    url: string;
    key: string;
  };
  logger: {
    level: string;
    enableColors: boolean;
    enableTimestamp: boolean;
  };
  permissions: {
    owner: string;
    admins: string[];
  };
  adminOnly?: boolean;
  adminBox?: boolean | Record<string, boolean>;
  antiINBOX?: boolean;
  ownerNoPrefix?: boolean | string[] | OwnerNoPrefixConfig;
}

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

const loadConfig = (): BotConfig => {
  if (!fs.existsSync(CONFIG_PATH)) {
    logger.error(`❌ Không tìm thấy file config.json tại: ${CONFIG_PATH}`);
    logger.error('Vui lòng tạo file config.json trước khi chạy bot!');
    throw new Error(`Config file not found: ${CONFIG_PATH}`);
  }

  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    logger.info('✅ Đã load config từ file');
    return config;
  } catch (error) {
    logger.error('❌ Lỗi đọc config file:', error);
    throw new Error(`Failed to load config: ${error}`);
  }
};

const botConfig = loadConfig();

export const PREFIX = botConfig.bot.prefix;
export const BOT_NAME = botConfig.bot.name;
export const APPSTATE_PATH = path.resolve(__dirname, '..', botConfig.paths.appstate);
export const COMMANDS_DIR = path.resolve(__dirname, '..', botConfig.paths.commands);
export const config: ApiOptions = botConfig.api;
export const OWNER_ID = botConfig.permissions.owner;
export const ADMIN_IDS = botConfig.permissions.admins || [];
export const EXTERNAL_API_URL = botConfig.externalApi?.url || '';
export const EXTERNAL_API_KEY = botConfig.externalApi?.key || '';

export const isOwner = (userID: string): boolean => {
  if (!OWNER_ID) {
    logger.warn('⚠️ Chưa có owner ID trong config!');
    return false;
  }
  return OWNER_ID === userID;
};

export const isAdmin = (userID: string): boolean => {
  if (isOwner(userID)) {
    return true;
  }
  return ADMIN_IDS.includes(userID);
};

export { botConfig };
export type { BotConfig };
