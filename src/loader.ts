import fs from 'fs';
import path from 'path';
import { ICommand } from '../types';
import { client } from './client';
import { COMMANDS_DIR } from './config';
import { logger } from './utils/logger';

const registerCommand = (command: ICommand, fullPath: string, dir: string): void => {
  if (!command.config || !command.config.name) return;

  const category = path.relative(COMMANDS_DIR, dir).replace(/\\/g, '/') || 'root';
  const prefix = category !== 'root' ? `[${category}]` : '';

  const oldCommand = client.commands.get(command.config.name) || client.noprefix.get(command.config.name);
  if (oldCommand?.config?.aliases) {
    oldCommand.config.aliases.forEach(alias => {
      client.commands.delete(alias.toLowerCase());
      client.noprefix.delete(alias.toLowerCase());
    });
  }
  client.commands.delete(command.config.name);
  client.noprefix.delete(command.config.name);

  if (command.config.hasPrefix === false) {
    client.noprefix.set(command.config.name, command);
    if (command.config.aliases && Array.isArray(command.config.aliases)) {
      command.config.aliases.forEach(alias => {
        const aliasLower = alias.toLowerCase();
        if (client.noprefix.has(aliasLower) && client.noprefix.get(aliasLower)?.config.name !== command.config.name) {
          logger.warn(`${prefix} Alias "${alias}" đã được sử dụng bởi lệnh khác, bỏ qua`);
        } else {
          client.noprefix.set(aliasLower, command);
        }
      });
    }
  } else {
    client.commands.set(command.config.name, command);
    if (command.config.aliases && Array.isArray(command.config.aliases)) {
      command.config.aliases.forEach(alias => {
        const aliasLower = alias.toLowerCase();
        if (client.commands.has(aliasLower) && client.commands.get(aliasLower)?.config.name !== command.config.name) {
          logger.warn(`${prefix} Alias "${alias}" đã được sử dụng bởi lệnh khác, bỏ qua`);
        } else {
          client.commands.set(aliasLower, command);
        }
      });
    }
  }
};

export const findCommandFile = (targetName: string, dir: string = COMMANDS_DIR): string | null => {
  if (!fs.existsSync(dir)) return null;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const found = findCommandFile(targetName, fullPath);
      if (found) return found;
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.js'))) {
      try {
        delete require.cache[require.resolve(fullPath)];
        const command: ICommand = require(fullPath);
        if (command.config?.name === targetName) {
          return fullPath;
        }
      } catch (error) {
      }
    }
  }
  return null;
};

export const loadSingleCommand = (commandName: string): { success: boolean; message: string } => {
  const filePath = findCommandFile(commandName);

  if (!filePath) {
    return { success: false, message: `❌ Không tìm thấy file lệnh "${commandName}"` };
  }

  try {
    delete require.cache[require.resolve(filePath)];
    const command: ICommand = require(filePath);

    if (!command.config || !command.config.name) {
      return { success: false, message: `❌ File không phải là command hợp lệ` };
    }

    const dir = path.dirname(filePath);
    registerCommand(command, filePath, dir);

    const category = path.relative(COMMANDS_DIR, dir).replace(/\\/g, '/') || 'root';
    const prefix = category !== 'root' ? `[${category}]` : '';

    return {
      success: true,
      message: `✅ Đã tải lại lệnh: ${prefix} ${command.config.name}`
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Lỗi khi load: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const loadMultipleCommands = (commandNames: string[]): { success: boolean; message: string; loaded: number; failed: number } => {
  let loaded = 0;
  let failed = 0;
  const failedCommands: string[] = [];

  for (const commandName of commandNames) {
    const result = loadSingleCommand(commandName);
    if (result.success) {
      loaded++;
    } else {
      failed++;
      failedCommands.push(commandName);
    }
  }

  let message = `✅ Đã tải ${loaded} lệnh`;
  if (failed > 0) {
    message += `\n❌ Thất bại ${failed} lệnh: ${failedCommands.join(', ')}`;
  }

  return {
    success: loaded > 0,
    message,
    loaded,
    failed
  };
};

export const unloadCommand = (commandName: string): { success: boolean; message: string } => {
  const command = client.commands.get(commandName) || client.noprefix.get(commandName);

  if (!command) {
    return { success: false, message: `❌ Không tìm thấy lệnh "${commandName}"` };
  }

  client.commands.delete(commandName);
  client.noprefix.delete(commandName);

  if (command.config?.aliases) {
    command.config.aliases.forEach(alias => {
      client.commands.delete(alias.toLowerCase());
      client.noprefix.delete(alias.toLowerCase());
    });
  }

  let removedReplies = 0;
  let removedReactions = 0;

  for (const [messageID, context] of client.handleReplies.entries()) {
    if (context.name === commandName) {
      client.handleReplies.delete(messageID);
      removedReplies++;
    }
  }

  for (const [messageID, context] of client.handleReactions.entries()) {
    if (context.name === commandName) {
      client.handleReactions.delete(messageID);
      removedReactions++;
    }
  }

  let extraInfo = '';
  if (removedReplies > 0 || removedReactions > 0) {
    extraInfo = ` (đã xóa ${removedReplies} handleReply, ${removedReactions} handleReaction)`;
  }

  return {
    success: true,
    message: `✅ Đã gỡ bỏ lệnh "${commandName}"${command.config?.aliases ? ` và ${command.config.aliases.length} alias` : ''}${extraInfo}`
  };
};

export const loadCommands = (dir: string = COMMANDS_DIR): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      loadCommands(fullPath);
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.js'))) {
      try {
        delete require.cache[require.resolve(fullPath)];

        const command: ICommand = require(fullPath);

        if (command.config && command.config.name) {
          registerCommand(command, fullPath, dir);
        }
      } catch (error) {
        logger.error(`Lỗi load file ${fullPath}:`, error);
      }
    }
  }

  if (dir === COMMANDS_DIR) {
    logger.info(`Tổng kết: ${client.commands.size} lệnh prefix, ${client.noprefix.size} lệnh no-prefix`);
  }
};
