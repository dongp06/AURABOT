import type { IFCAU_API } from '@dongdev/fca-unofficial';
import { Threads } from '../../database/controllers/threadController';
import { Users } from '../../database/controllers/userController';
import { MessageEventType } from '../../types';
import { client } from '../client';
import { botConfig, isOwner } from '../config';
import { logger } from '../utils/logger';
import { createMessageHelper } from '../utils/message';
import { hasPermission } from '../utils/permissions';
import { checkCommandPermission, ownerNoPrefixAllowed } from '../utils/permissionsExtended';

export const handleNoPrefixCommand = async (
  api: IFCAU_API,
  event: MessageEventType,
  body: string
): Promise<void> => {
  const isOwnerUser = isOwner(event.senderID);
  const parts = body.trim().split(/\s+/);
  const inCmd = parts.shift()?.toLowerCase() || '';

  let command = client.noprefix.get(inCmd);
  if (!command) {
    command = [...client.noprefix.values()].find(c =>
      c.config.aliases?.includes(inCmd)
    );
  }

  if (!command) return;

  const canNoPrefix = command.config.hasPrefix === false ||
    ownerNoPrefixAllowed(command, botConfig.ownerNoPrefix, isOwnerUser);

  if (!canNoPrefix) return;

  try {
    const permCheck = await checkCommandPermission(api, command, event, {
      adminOnly: botConfig.adminOnly,
      adminBox: botConfig.adminBox,
      antiINBOX: botConfig.antiINBOX
    });

    if (!permCheck.allowed) {
      const messageHelper = createMessageHelper(api, event);
      await messageHelper.send(permCheck.reason || '❌ Bạn không có quyền sử dụng lệnh này!');
      return;
    }

    const requiredRole = command.config.role ?? 0;
    const hasAccess = await hasPermission(api, event.senderID, event, requiredRole);

    if (!hasAccess) {
      const roleNames = ['Người dùng', 'Admin nhóm', 'Admin bot', 'Owner'];
      const messageHelper = createMessageHelper(api, event);
      await messageHelper.send(
        `❌ Bạn không có quyền sử dụng lệnh này!\n` +
        `Yêu cầu: ${roleNames[requiredRole]} (${requiredRole})`
      );
      return;
    }

    const args = parts;
    const messageHelper = createMessageHelper(api, event);
    await command.run({
      api,
      event,
      args,
      name: inCmd,
      config: command.config,
      Users,
      Threads,
      send: messageHelper.send,
      reply: messageHelper.reply,
      react: messageHelper.react
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes('skip')) {
      logger.error(`Lỗi khi chạy noprefix ${inCmd}:`, error);
    }
  }
};
