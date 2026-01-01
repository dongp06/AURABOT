import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../src/utils/logger';
import { ICommand, IRunParams } from '../../types';

const execAsync = promisify(exec);

const command: ICommand = {
  config: {
    name: "shell",
    version: "1.0.0",
    author: "Donix",
    description: "Chạy lệnh shell/terminal (chỉ owner)",
    category: "Admin",
    usages: "!shell <command>",
    aliases: ["sh", "cmd", "terminal"],
    role: 3 // Owner
  },

  run: async ({ api, event, args, send, reply, react, Users, Threads, config: cmdConfig }: IRunParams) => {
    const { threadID, messageID } = event;

    try {
      const commandStr = args.join(' ');
      if (!commandStr) {
        await send('⚠️ Vui lòng nhập lệnh shell để thực thi.\n📝 Ví dụ: !shell dir hoặc !shell ls -la');
        return;
      }

      await react('⏳');

      const { stdout, stderr } = await execAsync(commandStr, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000,
      });

      await react('✅');

      let output = '';

      if (stdout) {
        output += `📤 STDOUT:\n${stdout}\n\n`;
      }

      if (stderr && stderr.trim()) {
        output += `⚠️ STDERR:\n${stderr}\n\n`;
      }

      if (!output.trim()) {
        await send('✅ Lệnh đã được thực thi thành công (không có output).');
        return;
      }

      if (output.length > 2000) {
        const truncated = output.substring(0, 1950);
        await send(`${truncated}\n\n... (đã cắt bớt, tổng cộng ${output.length} ký tự)`);
      } else {
        await send(output.trim());
      }

    } catch (e: any) {
      await react('❌');

      let errorMessage = '';

      if (e.code === 'ENOENT') {
        errorMessage = `❌ Lỗi: Không tìm thấy lệnh "${args[0]}"\n📝 Lệnh này không tồn tại hoặc không có trong PATH.`;
      } else if (e.code === 'ETIMEDOUT' || e.message?.includes('timeout')) {
        errorMessage = `⏱️ Lỗi: Lệnh đã vượt quá thời gian chờ (60 giây).`;
      } else if (e.stderr) {
        errorMessage = `❌ STDERR:\n${e.stderr}`;
      } else {
        errorMessage = `❌ Lỗi: ${e.message || 'Không rõ lỗi.'}`;
      }

      if (errorMessage.length > 2000) {
        const truncated = errorMessage.substring(0, 1950);
        await send(`${truncated}\n\n... (đã cắt bớt)`);
      } else {
        await send(errorMessage);
      }

      logger.error('Shell command error:', e);
    }
  }
};

export = command;
