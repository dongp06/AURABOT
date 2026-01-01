import { ICommand, IRunParams } from '../../types';
import { client } from '../../src/client';
import { PREFIX } from '../../src/config';

const command: ICommand = {
    config: {
        name: "help",
        version: "1.0.0",
        author: "Donix",
        description: "Xem danh sách lệnh",
        category: "System"
    },

    run: async ({ api, event, args }: IRunParams) => {
        const commandName = args[0]?.toLowerCase();

        if (commandName) {
            const cmd = client.commands.get(commandName);
            if (cmd) {
                const info = `
📋 Thông tin lệnh: ${PREFIX}${cmd.config.name}

📝 Mô tả: ${cmd.config.description || 'Không có mô tả'}
👤 Tác giả: ${cmd.config.author || 'Unknown'}
📦 Phiên bản: ${cmd.config.version || '1.0.0'}
📁 Danh mục: ${cmd.config.category || 'General'}
                `.trim();
                api.sendMessage(info, event.threadID);
            } else {
                api.sendMessage(`❓ Không tìm thấy lệnh "${commandName}"`, event.threadID);
            }
            return;
        }

        const categories = new Map<string, string[]>();

        for (const [name, cmd] of client.commands.entries()) {
            const category = cmd.config.category || 'General';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(name);
        }

        let message = `📚 Danh sách lệnh (Prefix: ${PREFIX})\n\n`;

        for (const [category, commands] of categories.entries()) {
            message += `📁 ${category}:\n`;
            message += commands.map(cmd => `  • ${PREFIX}${cmd}`).join('\n');
            message += '\n\n';
        }

        message += `💡 Dùng ${PREFIX}help <tên lệnh> để xem chi tiết`;

        api.sendMessage(message, event.threadID);
    }
};

export = command;
