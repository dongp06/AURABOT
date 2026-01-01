import { unloadCommand } from '../../src/loader';
import { IRunParams } from '../../types';
import { ICommand } from '../../types';

const command: ICommand = {
  config: {
    name: "unload",
    version: "1.0.0",
    author: "Donix",
    description: "Gỡ bỏ lệnh khỏi memory",
    category: "System",
    usages: "!unload <tên lệnh>",
    aliases: ["remove"],
    role: 2 // Admin bot
  },

  run: async ({ api, event, args, send }: IRunParams) => {

    if (args.length === 0) {
      await send(
        "Vui lòng nhập tên lệnh cần gỡ bỏ!\n" +
        "• !unload <tên lệnh> - Gỡ bỏ 1 lệnh\n" +
        "Ví dụ: !unload ping"
      );
      return;
    }

    const commandName = args[0].toLowerCase();
    const result = unloadCommand(commandName);
    await send(result.message);
  }
};

export = command;
