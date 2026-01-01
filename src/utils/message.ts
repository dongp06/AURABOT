import type { IFCAU_API } from '@dongdev/fca-unofficial';
import type { MessageEventType } from '../../types';

export interface MessageHelper {
  send: (message: string, threadID?: string) => Promise<void>;
  reply: (message: string, messageID?: string) => Promise<void>;
  react: (emoji: string, messageID?: string) => Promise<void>;
}

export const createMessageHelper = (
  api: IFCAU_API,
  event: MessageEventType
): MessageHelper => {
  const threadID = event.threadID;
  const messageID = event.messageID;

  return {
    send: async (message: string, targetThreadID?: string): Promise<void> => {
      const targetID = targetThreadID || threadID;
      return new Promise((resolve, reject) => {
        api.sendMessage(message, targetID, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },

    reply: async (message: string, targetMessageID?: string): Promise<void> => {
      const targetID = targetMessageID || messageID;
      return new Promise((resolve, reject) => {
        api.sendMessage(
          message,
          threadID,
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
          targetID
        );
      });
    },

    react: async (emoji: string, targetMessageID?: string): Promise<void> => {
      const targetID = targetMessageID || messageID;
      return new Promise((resolve, reject) => {
        api.setMessageReaction(emoji, targetID, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };
};
