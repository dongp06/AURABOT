import { ICommand, IContextStore } from '../types';

export const client = {
  commands: new Map<string, ICommand>(),
  noprefix: new Map<string, ICommand>(),
  handleReplies: new Map<string, IContextStore>(),
  handleReactions: new Map<string, IContextStore>(),
  data: {
    users: new Set<string>(),
    threads: new Set<string>()
  }
};
