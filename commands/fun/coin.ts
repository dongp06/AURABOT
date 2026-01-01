import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "coin",
        version: "1.0.0",
        author: "Donix",
        description: "Tung đồng xu",
        category: "Fun"
    },

    run: async ({ api, event }: IRunParams) => {
        const result = Math.random() < 0.5 ? "Ngửa" : "Sấp";
        const emoji = result === "Ngửa" ? "🪙" : "🪙";
        api.sendMessage(`${emoji} Kết quả: ${result}`, event.threadID);
    }
};

export = command;
