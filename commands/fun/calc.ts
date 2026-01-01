import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
  config: {
    name: "calc",
    version: "1.0.0",
    author: "Donix",
    description: "Máy tính đơn giản",
    category: "Fun",
    usages: "!calc <biểu thức>"
  },

  run: async ({ api, event, args }: IRunParams) => {
    if (args.length === 0) {
      api.sendMessage("Vui lòng nhập biểu thức! Ví dụ: !calc 2+2", event.threadID);
      return;
    }

    const expression = args.join(' ');

    try {
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        api.sendMessage("❌ Biểu thức không hợp lệ! Chỉ cho phép số và phép toán cơ bản.", event.threadID);
        return;
      }

      const result = Function(`"use strict"; return (${expression})`)();

      api.sendMessage(`🧮 ${expression} = ${result}`, event.threadID);
    } catch (error) {
      api.sendMessage("❌ Không thể tính toán biểu thức này!", event.threadID);
    }
  }
};

export = command;
