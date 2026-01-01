import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
  config: {
    name: "autosad",
    hasPrefix: false,
    description: "Tự động an ủi khi thấy chữ buồn",
    category: "Fun",
  },

  run: async ({ api, event }: IRunParams) => {
    const body = event.body.toLowerCase();

    const sadKeywords = ['buồn', 'chán', 'khóc', 'sad', 'depressed', 'tủi thân'];
    const isSad = sadKeywords.some(word => body.includes(word));

    if (isSad) {
      api.sendMessage("Năm mới 2026 rồi, vui lên đi bạn ơi! Đừng buồn nữa ❤️", event.threadID);
    }
  }
};

export = command;
