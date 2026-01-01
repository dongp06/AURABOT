import { ICommand, IRunParams } from '../../types';
import { Users } from '../../database/controllers/userController';

const command: ICommand = {
  config: {
    name: "top",
    version: "1.0.0",
    author: "Donix",
    description: "Xem top người chơi (tiền hoặc EXP)",
    category: "Fun"
  },

  run: async ({ api, event, args }: IRunParams) => {
    const { threadID } = event;

    const type = args[0]?.toLowerCase() || "money";
    const limit = 10;

    try {
      let topUsers;
      let title;

      if (type === "exp" || type === "experience") {
        topUsers = await Users.getTopExp(limit);
        title = "🏆 TOP EXP";
      } else {
        topUsers = await Users.getTopMoney(limit);
        title = "🏆 TOP TIỀN";
      }

      if (topUsers.length === 0) {
        api.sendMessage("📭 Chưa có dữ liệu!", threadID);
        return;
      }

      let message = `${title}\n\n`;

      topUsers.forEach((user, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
        const value = type === "exp" ? user.exp : user.money;
        const unit = type === "exp" ? " EXP" : "$";

        message += `${medal} ${user.name}: ${value}${unit}\n`;
      });

      api.sendMessage(message.trim(), threadID);
    } catch (error) {
      api.sendMessage("❌ Có lỗi xảy ra khi lấy top!", threadID);
    }
  }
};

export = command;
