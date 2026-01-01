import type { IFCAU_API } from '@dongdev/fca-unofficial';
import type { MessageEventType, ICommand } from '../../types';
import { isOwner, isAdmin, OWNER_ID, ADMIN_IDS } from '../config';
import { Users } from '../../database/controllers/userController';
import { Threads } from '../../database/controllers/threadController';
import { isGroupAdmin } from './permissions';
import { logger } from './logger';

const commandCooldowns = new Map<string, Map<string, number>>();

export const checkCooldown = (
  commandName: string,
  userID: string,
  cooldownSeconds: number = 1
): { allowed: boolean; timeLeft: number } => {
  if (!commandCooldowns.has(commandName)) {
    commandCooldowns.set(commandName, new Map());
  }

  const userCooldowns = commandCooldowns.get(commandName)!;
  const lastTime = userCooldowns.get(userID) || 0;
  const now = Date.now();
  const cooldownMs = cooldownSeconds * 1000;
  const timeLeft = cooldownMs - (now - lastTime);

  if (timeLeft > 0) {
    return { allowed: false, timeLeft };
  }

  userCooldowns.set(userID, now);
  return { allowed: true, timeLeft: 0 };
};

interface BannedInfo {
  reason?: string;
  time?: number;
  bannedBy?: string;
}

export const isUserBanned = async (userID: string): Promise<BannedInfo | null> => {
  try {
    const user = await Users.getInfo(userID);
    if (!user || !user.info) return null;

    const banned = (user.info as any)?.banned as BannedInfo | undefined;

    if (banned && Object.keys(banned).length > 0) {
      return banned;
    }
    return null;
  } catch {
    return null;
  }
};

export const isThreadBanned = async (threadID: string): Promise<BannedInfo | null> => {
  try {
    const settings = await Threads.getSettings(threadID);
    const banned = (settings as any)?.banned as BannedInfo | undefined;

    if (banned && Object.keys(banned).length > 0) {
      return banned;
    }
    return null;
  } catch {
    return null;
  }
};

export const checkBanned = async (
  userID: string,
  threadID: string,
  isGroup: boolean
): Promise<{ banned: boolean; info: BannedInfo | null; type: 'user' | 'thread' | null }> => {
  if (isGroup) {
    const threadBan = await isThreadBanned(threadID);
    if (threadBan) {
      return { banned: true, info: threadBan, type: 'thread' };
    }
  }

  const userBan = await isUserBanned(userID);
  if (userBan) {
    return { banned: true, info: userBan, type: 'user' };
  }

  return { banned: false, info: null, type: null };
};

export const checkAdminBox = async (
  api: IFCAU_API,
  userID: string,
  threadID: string,
  isGroup: boolean,
  adminBoxEnabled: boolean | Record<string, boolean> = false
): Promise<boolean> => {
  if (!adminBoxEnabled) return false;

  if (isOwner(userID) || isAdmin(userID)) return false;

  if (typeof adminBoxEnabled === 'object') {
    if (adminBoxEnabled[threadID] !== true) return false;
  }

  if (!isGroup) return false;

  const isGroupAdminUser = await isGroupAdmin(api, userID, threadID);
  return !isGroupAdminUser;
};

interface OwnerNoPrefixConfig {
  all?: boolean;
  list?: string[];
}

const normalizeOwnerNoPrefix = (cfg: boolean | string[] | OwnerNoPrefixConfig | undefined): OwnerNoPrefixConfig => {
  if (cfg === true) return { all: true, list: [] };
  if (cfg === false) return { all: false, list: [] };
  if (Array.isArray(cfg)) return { all: false, list: cfg };
  if (typeof cfg === 'object' && cfg) {
    return {
      all: cfg.all === true,
      list: Array.isArray(cfg.list) ? cfg.list : []
    };
  }
  return { all: true, list: [] };
};

export const ownerNoPrefixAllowed = (
  command: ICommand,
  config: OwnerNoPrefixConfig | boolean | string[] | undefined,
  isOwnerUser: boolean
): boolean => {
  if (!isOwnerUser || !command) return false;

  const cfg = normalizeOwnerNoPrefix(config);
  if (cfg.all) return true;

  const set = new Set(cfg.list?.map(x => String(x).toLowerCase()) || []);
  const name = String(command.config.name || '').toLowerCase();

  if (set.has(name)) return true;

  const aliases = Array.isArray(command.config.aliases) ? command.config.aliases : [];
  for (const alias of aliases) {
    if (set.has(String(alias).toLowerCase())) return true;
  }

  return false;
};

interface BannedCommandInfo {
  bannedBy: string;
  reason?: string;
  time?: number;
}

export const isCommandBanned = async (
  commandName: string,
  threadID: string
): Promise<BannedCommandInfo | null> => {
  try {
    const settings = await Threads.getSettings(threadID);
    const bannedCommands = (settings as any)?.bannedCommandsInfo as Record<string, BannedCommandInfo> | undefined;

    if (bannedCommands && bannedCommands[commandName]) {
      return bannedCommands[commandName];
    }
    return null;
  } catch {
    return null;
  }
};

const DISABLE_PATH = process.cwd() + '/data/disable-commands.json';

interface DisableConfig {
  [threadID: string]: {
    commands?: Record<string, boolean>;
    categories?: Record<string, boolean>;
  };
}

const readDisableConfig = (): DisableConfig => {
  try {
    const fs = require('fs');
    if (!fs.existsSync(DISABLE_PATH)) return {};
    const data = fs.readFileSync(DISABLE_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
};

export const isCommandDisabled = (
  commandName: string,
  category: string | undefined,
  threadID: string
): { disabled: boolean; reason: string | null } => {
  try {
    const config = readDisableConfig();
    const threadConfig = config[threadID];

    if (!threadConfig) return { disabled: false, reason: null };

    if (category && threadConfig.categories?.[category]) {
      return { disabled: true, reason: `Category '${category}' đã bị cấm trong nhóm này` };
    }

    if (threadConfig.commands?.[commandName]) {
      return { disabled: true, reason: `Lệnh '${commandName}' đã bị cấm trong nhóm này` };
    }

    return { disabled: false, reason: null };
  } catch {
    return { disabled: false, reason: null };
  }
};

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  type?: 'banned' | 'adminbox' | 'cooldown' | 'banned_command' | 'disabled_command' | 'role';
}

export const checkCommandPermission = async (
  api: IFCAU_API,
  command: ICommand,
  event: MessageEventType,
  config: {
    adminOnly?: boolean;
    adminBox?: boolean | Record<string, boolean>;
    ownerNoPrefix?: boolean | string[] | OwnerNoPrefixConfig;
    antiINBOX?: boolean;
  } = {}
): Promise<PermissionCheckResult> => {
  const { senderID, threadID, isGroup } = event;
  const commandName = command.config.name;

  const isOwnerUser = isOwner(senderID);
  const isAdminUser = isAdmin(senderID);
  const isBotAdmin = isOwnerUser || isAdminUser;

  if (!isBotAdmin) {
    const bannedCheck = await checkBanned(senderID, threadID, isGroup || false);
    if (bannedCheck.banned) {
      const type = bannedCheck.type === 'user' ? 'Bạn' : 'Nhóm';
      return {
        allowed: false,
        reason: `${type} bị mất quyền công dân\nLý do: ${bannedCheck.info?.reason || 'Không rõ'}`,
        type: 'banned'
      };
    }
  }

  if (!isBotAdmin) {
    const adminBoxBlocked = await checkAdminBox(api, senderID, threadID, isGroup || false, config.adminBox);
    if (adminBoxBlocked) {
      return {
        allowed: false,
        reason: '[ WARNING ] - Chỉ quản trị viên nhóm mới dùng được bot!',
        type: 'adminbox'
      };
    }
  }

  if (config.adminOnly && !isBotAdmin) {
    return {
      allowed: false,
      reason: '⚠ Bot đang bảo trì !!!',
      type: 'role'
    };
  }

  if (!isBotAdmin) {
    const bannedCmd = await isCommandBanned(commandName, threadID);
    if (bannedCmd && bannedCmd.bannedBy !== senderID) {
      return {
        allowed: false,
        reason: `⚠️ Lệnh "${commandName}" bị cấm bởi Admin trong nhóm này`,
        type: 'banned_command'
      };
    }
  }

  if (!isBotAdmin) {
    const disabled = isCommandDisabled(commandName, command.config.category, threadID);
    if (disabled.disabled) {
      return {
        allowed: false,
        reason: disabled.reason || `Lệnh '${commandName}' đã bị cấm`,
        type: 'disabled_command'
      };
    }
  }

  const cooldown = command.config.cooldown || 1;
  const cooldownCheck = checkCooldown(commandName, senderID, cooldown);
  if (!cooldownCheck.allowed) {
    const seconds = Math.ceil(cooldownCheck.timeLeft / 1000);
    return {
      allowed: false,
      reason: `⏱️ Thao tác quá nhanh, vui lòng đợi ${seconds} giây nữa!`,
      type: 'cooldown'
    };
  }

  return { allowed: true };
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};
