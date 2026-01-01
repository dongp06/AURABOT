import type { IFCAU_API } from '@dongdev/fca-unofficial';
import { Threads } from '../../database/controllers/threadController';
import { Users } from '../../database/controllers/userController';
import { MessageReactionEventType } from '../../types';
import { client } from '../client';
import { logger } from '../utils/logger';
import { createMessageHelper } from '../utils/message';

export const handleReaction = async (
  api: IFCAU_API,
  event: MessageReactionEventType
): Promise<void> => {
  await handleReactionEvent(api, event);
};

const processingReactions = new Map<string, Promise<void>>();

export const handleReactionEvent = async (
  api: IFCAU_API,
  event: MessageReactionEventType
): Promise<void> => {
  const messageID = event.messageID;

  if (processingReactions.has(messageID)) {
    logger.debug(`HandleReaction: Đang xử lý messageID ${messageID}, bỏ qua`);
    return;
  }

  if (client.handleReactions.has(messageID)) {
    const reactionData = client.handleReactions.get(messageID);
    if (reactionData) {
      const command = client.commands.get(reactionData.name) || client.noprefix.get(reactionData.name);
      if (!command) {
        client.handleReactions.delete(messageID);
        return;
      }

      const handleReactionMethod = command.handleReaction;
      if (!handleReactionMethod) {
        client.handleReactions.delete(messageID);
        return;
      }

      const processPromise = (async () => {
        try {
          const fakeMessageEvent = {
            ...event,
            type: "message" as const,
            body: "",
            threadID: event.threadID,
            senderID: event.senderID,
            messageID: event.messageID
          };
          const messageHelper = createMessageHelper(api, fakeMessageEvent as any);
          await handleReactionMethod({
            api,
            event: fakeMessageEvent as any,
            args: [],
            name: reactionData.name,
            config: command.config,
            Users,
            Threads,
            send: messageHelper.send,
            reply: messageHelper.reply,
            react: messageHelper.react,
            handleReaction: reactionData
          });
          logger.debug(`HandleReaction: ${reactionData.name} bởi ${event.senderID}`);
        } catch (error) {
          logger.error(`Lỗi HandleReaction ${reactionData.name}:`, error);
        } finally {
          processingReactions.delete(messageID);
        }
      })();

      processingReactions.set(messageID, processPromise);
      await processPromise;
    }
  }
};
