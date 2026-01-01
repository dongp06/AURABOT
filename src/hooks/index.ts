import type { IFCAU_API, IFCAU_ListenMessage } from '@dongdev/fca-unofficial';
import { MessageEventType, MessageReactionEventType, MessageReplyEventType, PresenceEventType, ReadReceiptEventType, ThreadEventType, TypingEventType } from '../../types';

export type HookCallback = (api: IFCAU_API, event: IFCAU_ListenMessage) => Promise<void> | void;
export type MessageHookCallback = (api: IFCAU_API, event: MessageEventType) => Promise<void> | void;
export type ReplyHookCallback = (api: IFCAU_API, event: MessageReplyEventType) => Promise<void> | void;
export type EventHookCallback = (api: IFCAU_API, event: ThreadEventType) => Promise<void> | void;
export type ReactionHookCallback = (api: IFCAU_API, event: MessageReactionEventType) => Promise<void> | void;
export type TypingHookCallback = (api: IFCAU_API, event: TypingEventType) => Promise<void> | void;
export type PresenceHookCallback = (api: IFCAU_API, event: PresenceEventType) => Promise<void> | void;
export type ReadReceiptHookCallback = (api: IFCAU_API, event: ReadReceiptEventType) => Promise<void> | void;

class HookManager {
  private hooks: {
    onAnyEvent: HookCallback[];
    onFirstChat: MessageHookCallback[];
    onChat: MessageHookCallback[];
    onRun: MessageHookCallback[];
    onReply: ReplyHookCallback[];
    handlerEvent: EventHookCallback[];
    onEvent: EventHookCallback[];
    onReaction: ReactionHookCallback[];
    typ: TypingHookCallback[];
    presence: PresenceHookCallback[];
    read_receipt: ReadReceiptHookCallback[];
  } = {
      onAnyEvent: [],
      onFirstChat: [],
      onChat: [],
      onRun: [],
      onReply: [],
      handlerEvent: [],
      onEvent: [],
      onReaction: [],
      typ: [],
      presence: [],
      read_receipt: []
    };

  onAnyEvent(callback: HookCallback): void {
    this.hooks.onAnyEvent.push(callback);
  }

  onFirstChat(callback: MessageHookCallback): void {
    this.hooks.onFirstChat.push(callback);
  }

  onChat(callback: MessageHookCallback): void {
    this.hooks.onChat.push(callback);
  }

  onRun(callback: MessageHookCallback): void {
    this.hooks.onRun.push(callback);
  }

  onReply(callback: ReplyHookCallback): void {
    this.hooks.onReply.push(callback);
  }

  handlerEvent(callback: EventHookCallback): void {
    this.hooks.handlerEvent.push(callback);
  }

  onEvent(callback: EventHookCallback): void {
    this.hooks.onEvent.push(callback);
  }

  onReaction(callback: ReactionHookCallback): void {
    this.hooks.onReaction.push(callback);
  }

  typ(callback: TypingHookCallback): void {
    this.hooks.typ.push(callback);
  }

  presence(callback: PresenceHookCallback): void {
    this.hooks.presence.push(callback);
  }

  read_receipt(callback: ReadReceiptHookCallback): void {
    this.hooks.read_receipt.push(callback);
  }

  async executeOnAnyEvent(api: IFCAU_API, event: IFCAU_ListenMessage): Promise<void> {
    for (const hook of this.hooks.onAnyEvent) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onAnyEvent hook:', error);
      }
    }
  }

  async executeOnFirstChat(api: IFCAU_API, event: MessageEventType): Promise<void> {
    for (const hook of this.hooks.onFirstChat) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onFirstChat hook:', error);
      }
    }
  }

  async executeOnChat(api: IFCAU_API, event: MessageEventType): Promise<void> {
    for (const hook of this.hooks.onChat) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onChat hook:', error);
      }
    }
  }

  async executeOnRun(api: IFCAU_API, event: MessageEventType): Promise<void> {
    for (const hook of this.hooks.onRun) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onRun hook:', error);
      }
    }
  }

  async executeOnReply(api: IFCAU_API, event: MessageReplyEventType): Promise<void> {
    for (const hook of this.hooks.onReply) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onReply hook:', error);
      }
    }
  }

  async executeHandlerEvent(api: IFCAU_API, event: ThreadEventType): Promise<void> {
    for (const hook of this.hooks.handlerEvent) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in handlerEvent hook:', error);
      }
    }
  }

  async executeOnEvent(api: IFCAU_API, event: ThreadEventType): Promise<void> {
    for (const hook of this.hooks.onEvent) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onEvent hook:', error);
      }
    }
  }

  async executeOnReaction(api: IFCAU_API, event: MessageReactionEventType): Promise<void> {
    for (const hook of this.hooks.onReaction) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in onReaction hook:', error);
      }
    }
  }

  async executeTyp(api: IFCAU_API, event: TypingEventType): Promise<void> {
    for (const hook of this.hooks.typ) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in typ hook:', error);
      }
    }
  }

  async executePresence(api: IFCAU_API, event: PresenceEventType): Promise<void> {
    for (const hook of this.hooks.presence) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in presence hook:', error);
      }
    }
  }

  async executeReadReceipt(api: IFCAU_API, event: ReadReceiptEventType): Promise<void> {
    for (const hook of this.hooks.read_receipt) {
      try {
        await hook(api, event);
      } catch (error) {
        console.error('Error in read_receipt hook:', error);
      }
    }
  }
}

export const hooks = new HookManager();
