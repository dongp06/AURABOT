import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "kick",
        version: "1.0.0",
        author: "Donix",
        description: "Kick người dùng khỏi nhóm",
        category: "Admin",
        usages: "!kick @user hoặc !kick <userID>",
        role: 1 // Admin nhóm
    },

    run: async ({ api, event, args, send }: IRunParams) => {

        if (!event.isGroup) {
            await send("Lệnh này chỉ dùng trong nhóm!");
            return;
        }

        if (args.length === 0) {
            await send("Vui lòng tag người cần kick hoặc nhập userID!");
            return;
        }

        let targetID = args[0];

        if (targetID.startsWith('@')) {
            const mentions = (event as any).mentions || {};
            targetID = Object.keys(mentions)[0] || targetID.replace('@', '');
        }

        try {
            api.removeUserFromGroup(targetID, event.threadID, async (err?: Error) => {
                if (err) {
                    await send(`❌ Lỗi khi kick: ${err.message}`);
                } else {
                    await send(`👢 Đã kick người dùng ${targetID} khỏi nhóm!`);
                }
            });
        } catch (error) {
            await send("❌ Có lỗi xảy ra khi kick người dùng!");
        }
    }
};

export = command;
