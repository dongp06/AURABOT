import type { IFCAU_API } from '@dongdev/fca-unofficial';
import { MessageEventType } from '../../types';
import { handlePrefixCommand } from './prefix';
import { handleNoPrefixCommand } from './noprefix';

export const handleCommand = async (
  api: IFCAU_API,
  event: MessageEventType
): Promise<void> => {
  const body = event.body?.trim() || "";

  const handled = await handlePrefixCommand(api, event, body);
  if (handled) return;

  await handleNoPrefixCommand(api, event, body);
};
