import type {
  IFCAU_API,
  IFCAU_Attachment,
  IFCAU_ListenMessage,
  IFCAU_Options,
  IFCAU_Thread,
  IFCAU_User,
  MessageObject
} from '@dongdev/fca-unofficial';

import type { MessageHelper } from '../src/utils/message';

export type {
  IFCAU_API, IFCAU_Attachment, IFCAU_ListenMessage, IFCAU_Options, IFCAU_Thread, IFCAU_User, MessageObject
};

export type MessageEventType = Extract<IFCAU_ListenMessage, { type: "message" }>;
export type MessageReplyEventType = Extract<IFCAU_ListenMessage, { type: "message_reply" }>;
export type TypingEventType = Extract<IFCAU_ListenMessage, { type: "typ" }>;
export type ReadEventType = Extract<IFCAU_ListenMessage, { type: "read" }>;
export type ReadReceiptEventType = Extract<IFCAU_ListenMessage, { type: "read_receipt" }>;
export type MessageReactionEventType = Extract<IFCAU_ListenMessage, { type: "message_reaction" }>;
export type PresenceEventType = Extract<IFCAU_ListenMessage, { type: "presence" }>;
export type MessageUnsendEventType = Extract<IFCAU_ListenMessage, { type: "message_unsend" }>;
export type ThreadEventType = Extract<IFCAU_ListenMessage, { type: "event" }>;

export type CommandRole = 0 | 1 | 2 | 3;

export interface ICommandConfig {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  category?: string;
  hasPrefix?: boolean;
  usages?: string;
  aliases?: string[];
  role?: CommandRole;
  cooldown?: number;
}

export interface ApiOptions {
  forceLogin?: boolean;
  listenEvents?: boolean;
  logLevel?: "silent" | "error" | "warn" | "info" | "verbose";
  selfListen?: boolean;
}

export interface FCAError extends Error {
  error?: string;
  code?: string | number;
}

export interface IRunParams {
  api: IFCAU_API;
  event: MessageEventType;
  args: string[];
  name: string;
  config: ICommandConfig;
  Users: typeof import('../database/controllers/userController').Users;
  Threads: typeof import('../database/controllers/threadController').Threads;
  send: MessageHelper['send'];
  reply: MessageHelper['reply'];
  react: MessageHelper['react'];
}

export interface IContextStore {
  messageID: string;
  name: string;
  author: string;
  [key: string]: unknown;
}

export interface IHandleParams extends IRunParams {
  handleReply?: IContextStore;
  handleReaction?: IContextStore;
}

export interface IChatParams {
  api: IFCAU_API;
  event: MessageEventType;
  config: ICommandConfig;
  Users: typeof import('../database/controllers/userController').Users;
  Threads: typeof import('../database/controllers/threadController').Threads;
  send: MessageHelper['send'];
  reply: MessageHelper['reply'];
  react: MessageHelper['react'];
}

export interface IEventParams {
  api: IFCAU_API;
  event: ThreadEventType;
  config: ICommandConfig;
  Users: typeof import('../database/controllers/userController').Users;
  Threads: typeof import('../database/controllers/threadController').Threads;
}

export interface ICommand {
  config: ICommandConfig;
  run: (params: IRunParams) => Promise<void> | void;

  handleReply?: (params: IHandleParams) => Promise<void> | void;
  handleReaction?: (params: IHandleParams) => Promise<void> | void;
  handleChat?: (params: IChatParams) => Promise<void> | void;
  handleEvent?: (params: IEventParams) => Promise<void> | void;
}

declare global {
  // eslint-disable-next-line no-var
  var cookie: {
    youtube?: string;
    [key: string]: string | undefined;
  };
}
