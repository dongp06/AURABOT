import axios from 'axios';
import fs from 'fs';
import { logger } from '../../src/utils/logger';
import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
  config: {
    name: "eval",
    version: "1.0.0",
    author: "Donix",
    description: "Chạy code JavaScript/TypeScript (chỉ owner)",
    category: "Admin",
    usages: "!eval <code>",
    aliases: ["exec", "run"],
    role: 3 // Owner
  },

  run: async ({ api, event, args, send, reply, react, Users, Threads, config: cmdConfig }: IRunParams) => {
    const { threadID, messageID } = event;
    const log = console.log;

    const tpo = (a: any): string => {
      if (a === null || a === undefined) return String(a);
      if (typeof a === 'object' && Object.keys(a || {}).length !== 0) {
        return JSON.stringify(a, null, 4);
      }
      if (['number', 'boolean'].includes(typeof a)) {
        return a.toString();
      }
      return String(a);
    };

    const sendMsg = async (content: any): Promise<void> => {
      await send(tpo(content));
    };

    const toPrintable = (value: any): string => {
      if (typeof value === 'undefined') return 'undefined';
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value, null, 2);
        } catch {
          return String(value);
        }
      }
      return value?.toString?.() ?? 'null';
    };

    const mocky = async (content: string): Promise<void> => {
      try {
        const res = await axios.post('https://api.mocky.io/api/mock', {
          status: 200,
          content: toPrintable(content),
          content_type: 'application/json',
          charset: 'UTF-8',
          secret: 'DongDev',
          expiration: 'never',
        });
        await send(res.data.link);
      } catch (err: any) {
        await send(`⚠️ Mocky API Error: ${err.message}`);
      }
    };

    try {
      const code = args.join(' ');
      if (!code) {
        await send('⚠️ Vui lòng nhập đoạn code để thực thi.');
        return;
      }

      const context = {
        api,
        event,
        args,
        send: sendMsg,
        reply,
        react,
        Users,
        Threads,
        config: cmdConfig,
        logger,
        axios,
        fs,
        threadID,
        messageID,
        log,
        sendMsg,
        tpo,
        contact: null,
        sid: event.senderID,
        tid: event.threadID,
        mid: event.messageID,
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Promise,
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        process,
        Buffer,
        global: globalThis
      };

      const run = new Function(
        ...Object.keys(context),
        `
        return (async () => {
          ${code}
        })();
      `
      );

      const result = await run(...Object.values(context));

      if (typeof result === 'undefined') return;

      if (typeof result === 'string' && result.length > 2000) {
        return await mocky(result);
      }

      await send(toPrintable(result));

    } catch (e: any) {
      console.error(e);
      try {
        const translated = await axios.get(
          'https://translate.googleapis.com/translate_a/single',
          {
            params: {
              client: 'gtx',
              sl: 'auto',
              tl: 'vi',
              dt: 't',
              q: e.message,
            },
          }
        );
        const translatedText = translated.data?.[0]?.[0]?.[0] ?? 'Không rõ lỗi.';
        await send(`⚠️ Lỗi: ${e.message}\n📝 Dịch: ${translatedText}`);
      } catch (err: any) {
        console.error(err);
        await send(`⚠️ Lỗi: ${e.message}\n📝 Không thể dịch lỗi.`);
      }
      logger.error('Eval error:', e);
    }
  }
};

export = command;
