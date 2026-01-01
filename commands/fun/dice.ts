import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "dice",
        version: "1.0.0",
        author: "Donix",
        description: "Gieo xúc xắc",
        category: "Fun"
    },

    run: async ({ api, event, args }: IRunParams) => {
        const sides = parseInt(args[0]) || 6;

        if (sides < 2 || sides > 100) {
            api.sendMessage("Số mặt xúc xắc phải từ 2 đến 100!", event.threadID);
            return;
        }

        const result = Math.floor(Math.random() * sides) + 1;
        const message = `🎲 Xúc xắc ${sides} mặt: ${result}`;
        api.sendMessage(message, event.threadID);
    }
};

export = command;
