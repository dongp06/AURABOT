import type { IFCAU_API, IFCAU_ListenMessage } from '@dongdev/fca-unofficial';
import handleCreateData from '../../database/handleCreateData';
import { MessageEventType, MessageReactionEventType, MessageReplyEventType, PresenceEventType, ReadReceiptEventType, ThreadEventType, TypingEventType } from '../../types';
import { hooks } from '../hooks';
import { handleAnyEvent } from './anyEvent';
import { handleChat } from './chat';
import { handleCommand } from './command';
import { handleEvent, onEvent } from './event';
import { presence } from './presence';
import { handleReaction } from './reaction';
import { read_receipt } from './readReceipt';
import { handleReplyEvent } from './reply';
import { typ } from './typing';

const firstChatMap = new Map<string, boolean>();

export const handleEventMain = async (
  api: IFCAU_API,
  event: IFCAU_ListenMessage
): Promise<void> => {
  await hooks.executeOnAnyEvent(api, event);

  await handleAnyEvent(api, event);

  switch (event.type) {
    case "message":
    case "message_reply":
    case "message_unsend": {
      if (event.type === "message") {
        const msgEvent = event as MessageEventType;
        const threadID = msgEvent.threadID;
        const isFirstChat = !firstChatMap.has(threadID);

        if (isFirstChat) {
          firstChatMap.set(threadID, true);
          await hooks.executeOnFirstChat(api, msgEvent);
        }
      }

      if (event.type === "message") {
        const msgEvent = event as MessageEventType;
        await handleCreateData(api, msgEvent);

        await hooks.executeOnChat(api, msgEvent);
        await handleChat(api, msgEvent);
      }

      if (event.type === "message") {
        await hooks.executeOnRun(api, event as MessageEventType);
      }

      if (event.type === "message") {
        await handleCommand(api, event as MessageEventType);
      }

      if (event.type === "message_reply") {
        await hooks.executeOnReply(api, event as MessageReplyEventType);
        await handleReplyEvent(api, event as MessageReplyEventType);
      }
      break;
    }

    case "event": {
      const threadEvent = event as ThreadEventType;
      await hooks.executeHandlerEvent(api, threadEvent);
      await handleEvent(api, threadEvent);
      await hooks.executeOnEvent(api, threadEvent);
      await onEvent(api, threadEvent);
      break;
    }

    case "message_reaction": {
      const reactionEvent = event as MessageReactionEventType;
      await hooks.executeOnReaction(api, reactionEvent);
      await handleReaction(api, reactionEvent);
      break;
    }

    case "typ": {
      const typingEvent = event as TypingEventType;
      await hooks.executeTyp(api, typingEvent);
      await typ(api, typingEvent);
      break;
    }

    case "presence": {
      const presenceEvent = event as PresenceEventType;
      await hooks.executePresence(api, presenceEvent);
      await presence(api, presenceEvent);
      break;
    }

    case "read_receipt": {
      const readReceiptEvent = event as ReadReceiptEventType;
      await hooks.executeReadReceipt(api, readReceiptEvent);
      await read_receipt(api, readReceiptEvent);
      break;
    }
  }
};

export { handleEventMain as handleEvent };

export { handleNoPrefixCommand } from './noprefix';
export { handlePrefixCommand } from './prefix';
export { handleReaction } from './reaction';
export { handleReplyEvent } from './reply';
