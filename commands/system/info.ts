import { ICommand, IRunParams } from '../../types';
import User from '../../database/models/User';
import Thread from '../../database/models/Thread';

const command: ICommand = {
  config: {
    name: "info",
    version: "1.0.0",
    author: "Donix",
    description: "Xem thông tin đã lưu trong DB",
    category: "System"
  },

  run: async ({ api, event }: IRunParams) => {
    const { senderID, threadID, isGroup } = event;

    try {
      const user = await User.findByPk(senderID);

      let msg = `=== 👤 USER INFO ===\n`;
      if (user) {
        msg += `Tên: ${user.name}\n`;
        msg += `Giới tính: ${user.gender}\n`;
        msg += `Tiền: ${user.money}$\n`;
        msg += `EXP: ${user.exp}\n`;
      } else {
        msg += `❌ Không tìm thấy thông tin user\n`;
      }

      if (isGroup) {
        const thread = await Thread.findByPk(threadID);
        msg += `\n=== 🏠 GROUP INFO ===\n`;
        if (thread) {
          msg += `Tên nhóm: ${thread.name}\n`;
          msg += `Prefix: ${thread.prefix}\n`;
          msg += `Rankup: ${thread.rankup ? 'Bật' : 'Tắt'}\n`;
        } else {
          msg += `❌ Không tìm thấy thông tin nhóm\n`;
        }
      }

      api.sendMessage(msg, threadID);
    } catch (error) {
      api.sendMessage("❌ Có lỗi xảy ra khi lấy thông tin!", threadID);
    }
  }
};

export = command;
