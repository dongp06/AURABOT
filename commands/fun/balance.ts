import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
  config: {
    name: "balance",
    version: "1.0.0",
    author: "Donix",
    description: "Xem số dư tiền và EXP",
    category: "Fun",
    aliases: ["bal", "money", "wallet"]
  },

  run: async ({ api, event, args, Users, Threads, send, reply, react }: IRunParams) => {
    let targetUID = event.senderID;

    if (args.length > 0 && event.mentions) {
    }

    try {
      const user = await Users.getData(targetUID);

      const isSelf = targetUID === event.senderID;
      const name = isSelf ? "Bạn" : user.name;

      await send(
        `💰 Thông tin tài khoản của ${name}:\n\n` +
        `💵 Tiền: ${user.money}$\n` +
        `⭐ EXP: ${user.exp}`
      );
    } catch (error) {
      await send("❌ Có lỗi xảy ra khi lấy thông tin!");
    }
  }
};

export = command;
