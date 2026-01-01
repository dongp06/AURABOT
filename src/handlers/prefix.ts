import type { IFCAU_API } from '@dongdev/fca-unofficial';
import { MessageEventType } from '../../types';
import { client } from '../client';
import { PREFIX, botConfig } from '../config';
import { logger } from '../utils/logger';
import { Users } from '../../database/controllers/userController';
import { Threads } from '../../database/controllers/threadController';
import { createMessageHelper } from '../utils/message';
import { hasPermission } from '../utils/permissions';
import { checkCommandPermission } from '../utils/permissionsExtended';
import { createMessageHelper as createHelper } from '../utils/message';

export const handlePrefixCommand = async (
  api: IFCAU_API,
  event: MessageEventType,
  body: string
): Promise<boolean> => {
  if (!body.startsWith(PREFIX)) return false;

  const args = body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return false;

  const command = client.commands.get(commandName);

  if (command) {
    try {
      const permCheck = await checkCommandPermission(api, command, event, {
        adminOnly: botConfig.adminOnly,
        adminBox: botConfig.adminBox,
        antiINBOX: botConfig.antiINBOX
      });

      if (!permCheck.allowed) {
        const messageHelper = createHelper(api, event);
        await messageHelper.send(permCheck.reason || '❌ Bạn không có quyền sử dụng lệnh này!');
        return true;
      }

      const requiredRole = command.config.role ?? 0;
      const hasAccess = await hasPermission(api, event.senderID, event, requiredRole);

      if (!hasAccess) {
        const roleNames = ['Người dùng', 'Admin nhóm', 'Admin bot', 'Owner'];
        const messageHelper = createHelper(api, event);
        await messageHelper.send(
          `❌ Bạn không có quyền sử dụng lệnh này!\n` +
          `Yêu cầu: ${roleNames[requiredRole]} (${requiredRole})`
        );
        return true;
      }

      const messageHelper = createMessageHelper(api, event);
      await command.run({
        api,
        event,
        args,
        name: commandName,
        config: command.config,
        Users,
        Threads,
        send: messageHelper.send,
        reply: messageHelper.reply,
        react: messageHelper.react
      });
      logger.debug(`Thực thi: ${commandName} bởi ${event.senderID}`);
      return true;
    } catch (error) {
      logger.error(`Lỗi khi chạy lệnh ${commandName}:`, error);
      const messageHelper = createHelper(api, event);
      await messageHelper.send("⚠️ Có lỗi xảy ra khi thực thi lệnh này.");
      return true;
    }
  } else {
    api.sendMessage(`❓ Không tìm thấy lệnh "${commandName}". Dùng ${PREFIX}help để xem danh sách.`, event.threadID);
    return true;
  }
};
