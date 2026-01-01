import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "ban",
        version: "1.0.0",
        author: "Donix",
        description: "Ban người dùng khỏi nhóm",
        category: "Admin",
        usages: "!ban @user hoặc !ban <userID>",
        role: 1 // Admin nhóm
    },

    run: async ({ api, event, args, send }: IRunParams) => {

        if (!event.isGroup) {
            await send("Lệnh này chỉ dùng trong nhóm!");
            return;
        }

        if (args.length === 0) {
            await send("Vui lòng tag người cần ban hoặc nhập userID!");
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
                    await send(`❌ Lỗi khi ban: ${err.message}`);
                } else {
                    await send(`✅ Đã ban người dùng ${targetID} khỏi nhóm!`);
                }
            });
        } catch (error) {
            await send("❌ Có lỗi xảy ra khi ban người dùng!");
        }
    }
};

export = command;
