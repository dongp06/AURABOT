import type { IFCAU_API } from '@dongdev/fca-unofficial';
import { ICommand, MessageEventType } from '../../types';
import { client } from '../client';
import { logger } from '../utils/logger';
import { Users } from '../../database/controllers/userController';
import { Threads } from '../../database/controllers/threadController';
import { createMessageHelper } from '../utils/message';

export const handleChat = async (
  api: IFCAU_API,
  event: MessageEventType
): Promise<void> => {
  const processedCommands = new Set<ICommand>();
  for (const command of [...client.commands.values(), ...client.noprefix.values()]) {
    if (command.handleChat && !processedCommands.has(command)) {
      processedCommands.add(command);
      try {
        const messageHelper = createMessageHelper(api, event);
        await command.handleChat({
          api,
          event,
          config: command.config,
          Users,
          Threads,
          send: messageHelper.send,
          reply: messageHelper.reply,
          react: messageHelper.react
        });
      } catch (error) {
        logger.error(`Lỗi handleChat trong command ${command.config.name}:`, error);
      }
    }
  }
};
