import { logger } from '../utils/logger';
import { hooks } from './index';

export const registerExampleHooks = (): void => {
  hooks.onAnyEvent(async (api, event) => {
    logger.debug(`Event type: ${event.type}`);
  });

  hooks.onFirstChat(async (api, event) => {
    logger.info(`First chat trong thread: ${event.threadID}`);
  });

  hooks.onChat(async (api, event) => {
    logger.debug(`Tin nhắn từ ${event.senderID}: ${event.body}`);
  });

  hooks.onRun(async (api, event) => {
    logger.debug(`Đang xử lý tin nhắn: ${event.body}`);
  });

  hooks.onReply(async (api, event) => {
    logger.debug(`Reply từ ${event.senderID}`);
  });

  hooks.handlerEvent(async (api, event) => {
    logger.debug(`Thread event: ${event.logMessageType}`);
  });

  hooks.onEvent(async (api, event) => {
    logger.debug(`Event trong thread: ${event.threadID}`);
  });

  hooks.onReaction(async (api, event) => {
    logger.debug(`Reaction ${event.reaction} từ ${event.senderID}`);
  });

  hooks.typ(async (api, event) => {
    if (event.isTyping) {
      logger.debug(`${event.from} đang gõ...`);
    }
  });

  hooks.presence(async (api, event) => {
    logger.debug(`User ${event.userID} presence: ${event.statuses}`);
  });

  hooks.read_receipt(async (api, event) => {
    logger.debug(`${event.reader} đã đọc tin nhắn`);
  });
};
