import type { IFCAU_API, IFCAU_Thread } from '@dongdev/fca-unofficial';
import type { CommandRole, MessageEventType } from '../../types';
import { isAdmin, isOwner } from '../config';

const groupAdminCache = new Map<string, { admins: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export const isGroupAdmin = async (
  api: IFCAU_API,
  userID: string,
  threadID: string
): Promise<boolean> => {
  try {
    const cached = groupAdminCache.get(threadID);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.admins.includes(userID);
    }

    const threadInfo: IFCAU_Thread | null = await new Promise((resolve) => {
      api.getThreadInfo(threadID, (err: Error | null, info: IFCAU_Thread | null) => {
        if (err) {
          return resolve(null);
        }
        resolve(info);
      });
    });

    if (threadInfo) {
      const adminIDs = threadInfo.adminIDs || [];

      groupAdminCache.set(threadID, {
        admins: adminIDs,
        timestamp: Date.now()
      });

      return adminIDs.includes(userID);
    }

    return false;
  } catch (error) {
    return false;
  }
};

export const getUserRole = async (
  api: IFCAU_API,
  userID: string,
  event: MessageEventType
): Promise<CommandRole> => {
  if (isOwner(userID)) {
    return 3;
  }

  if (isAdmin(userID)) {
    return 2;
  }

  if (event.isGroup) {
    const isGroupAdminUser = await isGroupAdmin(api, userID, event.threadID);
    if (isGroupAdminUser) {
      return 1;
    }
  }

  return 0;
};

export const hasPermission = async (
  api: IFCAU_API,
  userID: string,
  event: MessageEventType,
  requiredRole: CommandRole
): Promise<boolean> => {
  const userRole = await getUserRole(api, userID, event);
  return userRole >= requiredRole;
};

export const clearGroupAdminCache = (threadID: string): void => {
  groupAdminCache.delete(threadID);
};

export const clearAllGroupAdminCache = (): void => {
  groupAdminCache.clear();
};
