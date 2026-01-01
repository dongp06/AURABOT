import { ICommand, IRunParams } from '../../types';
import { Users } from '../../database/controllers/userController';

const lastDaily = new Map<string, number>();
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

const command: ICommand = {
  config: {
    name: "daily",
    version: "1.0.0",
    author: "Donix",
    description: "Điểm danh nhận tiền hàng ngày",
    category: "Fun"
  },

  run: async ({ api, event }: IRunParams) => {
    const { senderID, threadID } = event;

    const lastTime = lastDaily.get(senderID) || 0;
    const now = Date.now();
    const timeLeft = DAILY_COOLDOWN - (now - lastTime);

    if (timeLeft > 0) {
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      api.sendMessage(
        `⏰ Bạn đã điểm danh rồi! Vui lòng đợi ${hours} giờ ${minutes} phút nữa.`,
        threadID
      );
      return;
    }

    const reward = Math.floor(Math.random() * 401) + 100;

    const expReward = Math.floor(Math.random() * 41) + 10;

    try {
      const newBalance = await Users.addMoney(senderID, reward);
      const newExp = await Users.addExp(senderID, expReward);

      lastDaily.set(senderID, now);

      api.sendMessage(
        `✅ Điểm danh thành công!\n\n` +
        `💰 Nhận được: ${reward}$\n` +
        `⭐ Nhận được: ${expReward} EXP\n\n` +
        `💵 Tổng tiền: ${newBalance}$\n` +
        `📊 Tổng EXP: ${newExp}`,
        threadID
      );
    } catch (error) {
      api.sendMessage("❌ Có lỗi xảy ra khi điểm danh!", threadID);
    }
  }
};

export = command;
