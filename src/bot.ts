import type { IFCAU_API } from '@dongdev/fca-unofficial';
import login from '@dongdev/fca-unofficial';
import fs from 'fs';
import { APPSTATE_PATH, config } from './config';
import { handleEvent } from './handlers';
import { loadCommands } from './loader';
import { logger } from './utils/logger';

export const startBot = (): void => {
  loadCommands();

  if (!fs.existsSync(APPSTATE_PATH)) {
    logger.error("Thiếu file appstate.json");
    return;
  }

  const appState = JSON.parse(fs.readFileSync(APPSTATE_PATH, 'utf8'));

  login({ appState }, (err: Error | null, api: IFCAU_API | null) => {
    if (err) {
      console.error("❌ Login lỗi:", err);
      logger.error("Login lỗi:", err);
      return;
    }
    if (!api) return;

    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(api.getAppState(), null, 2));

    api.setOptions(config);

    api.listenMqtt(async (err, event) => {
      if (err) {
        logger.error("Lỗi listenMqtt:", err);
        return;
      }
      await handleEvent(api, event);
    });
  });
};
