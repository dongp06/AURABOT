import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "bot",
        hasPrefix: false,
        description: "Gọi bot thì bot thưa",
        category: "Fun"
    },

    run: async ({ api, event }: IRunParams) => {
        const body = event.body.toLowerCase();

        if (body.includes("bot ơi") || body === "bot" || body.includes("bot à")) {
            api.sendMessage("Dạ, em đây? Gọi gì em 2026 rồi vẫn chưa ngủ à? 😊", event.threadID);
        }
    }
};

export = command;
