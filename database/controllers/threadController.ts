import Thread from '../models/Thread';

export const Threads = {
  getData: async (threadID: string, name?: string, prefix?: string, rankup?: boolean): Promise<Thread> => {
    const [thread, created] = await Thread.findOrCreate({
      where: { threadID },
      defaults: {
        threadID,
        name: name || "Nhóm chưa đặt tên",
        prefix: prefix || "!",
        rankup: rankup || false
      }
    });

    let updated = false;
    if (name && thread.name !== name) {
      thread.name = name;
      updated = true;
    }
    if (prefix && thread.prefix !== prefix) {
      thread.prefix = prefix;
      updated = true;
    }
    if (rankup !== undefined && thread.rankup !== rankup) {
      thread.rankup = rankup;
      updated = true;
    }
    if (updated) {
      await thread.save();
    }

    return thread;
  },

  getSettings: async (threadID: string): Promise<Record<string, any>> => {
    const thread = await Threads.getData(threadID);
    if (!thread.settings) return {};
    try {
      return JSON.parse(thread.settings);
    } catch {
      return {};
    }
  },

  setSettings: async (threadID: string, settings: Record<string, any>): Promise<void> => {
    const thread = await Threads.getData(threadID);
    thread.settings = JSON.stringify(settings);
    await thread.save();
  },

  updateSetting: async (threadID: string, key: string, value: any): Promise<void> => {
    const settings = await Threads.getSettings(threadID);
    settings[key] = value;
    await Threads.setSettings(threadID, settings);
  },

  getInfo: async (threadID: string): Promise<Thread | null> => {
    return await Thread.findByPk(threadID);
  }
};
