import { client } from '../../src/client';
import { ICommand, IHandleParams, IRunParams } from '../../types';

const command: ICommand = {
  config: {
    name: "choose",
    version: "1.0.0",
    author: "Donix",
    description: "Test handle reply và reaction",
    hasPrefix: true,
    category: "Fun"
  },

  run: async ({ api, event }: IRunParams) => {
    api.sendMessage(
      "🔴 Bạn chọn Phe Đỏ (Reply tin nhắn này: 'red')\n🔵 Hay Phe Xanh (Thả tim vào tin nhắn này)?",
      event.threadID,
      (err, info) => {
        if (err) return;

        if (!info) return;

        client.handleReplies.set(info.messageID, {
          messageID: info.messageID,
          name: "choose",
          author: event.senderID,
          type: "chon_phe"
        });

        client.handleReactions.set(info.messageID, {
          messageID: info.messageID,
          name: "choose",
          author: event.senderID,
          secretCode: 12345
        });
      }
    );
  },

  handleReply: async ({ api, event, handleReply, config }: IHandleParams) => {
    if (!handleReply) return;

    if (event.senderID !== handleReply.author) {
      api.sendMessage("Không phải lượt của bạn nha!", event.threadID);
      return;
    }

    const answer = (event as any).body?.toLowerCase() || "";
    if (answer === "red") {
      api.sendMessage("🔥 Chào mừng bạn đến với Phe Đỏ hung hãn!", event.threadID);

      client.handleReplies.delete(handleReply.messageID);
    } else {
      api.sendMessage("Sai cú pháp rồi! Gõ 'red' đi.", event.threadID);
    }
  },

  handleReaction: async ({ api, event, handleReaction, config }: IHandleParams) => {
    if (!handleReaction) return;

    const reaction = (event as any).reaction;
    if (reaction === "❤" || reaction === "❤️") {
      api.sendMessage("🌊 Chào mừng bạn đến với Phe Xanh hòa bình!", event.threadID);
      client.handleReactions.delete(handleReaction.messageID);
    }
  }
};

export = command;
