import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "uid",
        hasPrefix: true,
        description: "Lấy UID người dùng",
        category: "Admin"
    },

    run: async ({ api, event }: IRunParams) => {
        api.sendMessage(`UID của bạn: ${event.senderID}`, event.threadID);
    }
};

export = command;
