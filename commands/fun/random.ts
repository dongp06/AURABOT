import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "random",
        version: "1.0.0",
        author: "Donix",
        description: "Chọn ngẫu nhiên từ danh sách",
        category: "Fun",
        usages: "!random item1, item2, item3"
    },

    run: async ({ api, event, args }: IRunParams) => {
        if (args.length === 0) {
            api.sendMessage("Vui lòng nhập danh sách! Ví dụ: !random A, B, C", event.threadID);
            return;
        }

        const input = args.join(' ');
        const items = input.split(',').map(item => item.trim()).filter(item => item.length > 0);

        if (items.length === 0) {
            api.sendMessage("❌ Danh sách không hợp lệ!", event.threadID);
            return;
        }

        const randomItem = items[Math.floor(Math.random() * items.length)];
        api.sendMessage(`🎲 Kết quả: ${randomItem}`, event.threadID);
    }
};

export = command;
