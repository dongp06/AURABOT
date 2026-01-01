import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { client } from '../../src/client';
import { logger } from '../../src/utils/logger';
import { ICommand, IChatParams, IHandleParams } from '../../types';

declare global {
  // eslint-disable-next-line no-var
  var autodownSoundCache: Map<string, { audiosMeta: Array<{ url: string; ext: string }>; threadID: string }> | undefined;
}

const supportedDomains = [
  "youtube.com", "youtu.be",
  "facebook.com", "fb.watch",
  "instagram.com", "threads.net",
  "tiktok.com", "vt.tiktok.com", "www.tiktok.com",
  "v.douyin.com", "douyin.com", "iesdouyin.com",
  "capcut.com",
  "twitter.com", "x.com",
  "soundcloud.com", "mixcloud.com",
  "zingmp3.vn", "nhaccuatui.com",
  "mediafire.com", "drive.google.com",
  "pixiv.net", "pinterest.com", "pin.it",
  "bilibili.com", "b23.tv",
  "reddit.com", "tumblr.com",
  "open.spotify.com",
  "ted.com", "vimeo.com", "rumble.com", "streamable.com",
  "snapchat.com", "linkedin.com",
  "imgur.com", "9gag.com",
  "xiaohongshu.com", "xhslink.com",
  "weibo.com", "sohu.com", "ixigua.com",
  "likee.video", "hipi.co.in", "sharechat.com",
  "nationalvideo.com", "yingke.com", "meipai.com", "xiaoying.tv",
  "getstickerpack.com", "bitchute.com", "febspot.com", "bandcamp.com", "izlesene.com"
];

const cacheDirectory = (() => {
  const dir = path.join(__dirname, "cache");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
})();

const stateFile = path.join(cacheDirectory, "autodown_state.json");

const persistState = (obj: Record<string, { enabled: boolean }>): void => {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(obj, null, 4));
  } catch (error) {
    logger.error(`Lỗi khi ghi state file: ${error}`);
  }
};

const retrieveState = (): Record<string, { enabled: boolean }> => {
  try {
    if (!fs.existsSync(stateFile)) {
      persistState({});
      return {};
    }
    const data = fs.readFileSync(stateFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Lỗi khi đọc state file: ${error}`);
    persistState({});
    return {};
  }
};

const streamURL = async (url: string, filename: string, options: Record<string, unknown> = {}): Promise<Readable> => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    ...options
  });
  return response.data as Readable;
};

const command: ICommand = {
  config: {
    name: "autodown",
    version: "1.0.4",
    author: "LocDev",
    description: "Tự động tải video/ảnh từ các nền tảng được hỗ trợ",
    category: "Media",
    usages: "[on/off/status/list] hoặc gửi link",
    cooldown: 5,
  },

  run: async ({ api, event, args, send }: IHandleParams) => {
    const { threadID } = event;
    const state = retrieveState();
    state[threadID] = state[threadID] || { enabled: true };

    const commandArg = (args[0] || "").toLowerCase();

    switch (commandArg) {
      case "on":
        state[threadID].enabled = true;
        persistState(state);
        await send("✅ Đã BẬT chế độ tự động tải link.", threadID);
        return;
      case "off":
        state[threadID].enabled = false;
        persistState(state);
        await send("⚠️ Đã TẮT chế độ tự động tải link.", threadID);
        return;
      case "status":
        await send(
          `📦 Tự động tải link đang ${state[threadID].enabled ? "✅ BẬT" : "❌ TẮT"} ở nhóm này.`,
          threadID
        );
        return;
      case "list":
        const listMessage = "📌 Các nền tảng hỗ trợ autodown:\n\n- " + supportedDomains.join("\n- ");
        await send(listMessage, threadID);
        // Auto delete after 30 seconds
        setTimeout(async () => {
          try {
            // Note: api.unsendMessage might not be available, so we'll skip this
            // If needed, you can implement it differently
          } catch (error) {
            // Ignore errors
          }
        }, 30 * 1000);
        return;
      default:
        await send(
          `❓ Cách dùng:\n• autodown on - Bật\n• autodown off - Tắt\n• autodown status - Kiểm tra trạng thái\n• autodown list - Danh sách nền tảng hỗ trợ`,
          threadID
        );
        return;
    }
  },

  handleChat: async ({ api, event }: IChatParams) => {
    const { threadID, messageID, body } = event;
    if (!body || typeof body !== "string") return;

    const state = retrieveState();
    state[threadID] = state[threadID] || { enabled: true };

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const detectedURLs = body.match(urlPattern);
    const urls = Array.isArray(detectedURLs) ? detectedURLs : [];
    if (urls.length === 0) {
      return;
    }

    const firstURL = urls.find(url =>
      supportedDomains.some(domain => url.includes(domain))
    );
    if (!firstURL) {
      logger.debug("Không có URL thuộc nền tảng hỗ trợ.", "[ AUTODOWN ]");
      return;
    }

    logger.info(`Phát hiện URL hợp lệ: ${firstURL}`, "[ AUTODOWN ]");
    if (!state[threadID].enabled) {
      logger.debug(`Tự động bỏ qua do đã tắt ở thread ${threadID}`, "[ AUTODOWN ]");
      return;
    }

    // Lưu messageID -> danh sách audio stream để gửi khi có reaction
    if (!global.autodownSoundCache) {
      global.autodownSoundCache = new Map();
    }
    const soundCache = global.autodownSoundCache;

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'vi-VN, en-US'
      };

      const isThreads = firstURL.includes("threads.net");
      const apiURL = `https://api.nemg.me/all?link=${encodeURIComponent(firstURL)}`;

      logger.info(`Gửi request tới API: ${apiURL}`, "[ AUTODOWN ]");

      const response = isThreads
        ? await axios.get(apiURL, { headers })
        : await axios.get(apiURL);

      const payload = response?.data;
      // Một số API trả về { data: {...} }, một số trả thẳng {...}
      const data = payload?.data || payload;

      if (!data) {
        logger.warn("API không trả về dữ liệu.", "[ AUTODOWN ]");
        return;
      }

      const medias = data.media_urls || data.medias;
      if (!medias || medias.length === 0) {
        logger.warn("Không tìm thấy media để tải xuống.", "[ AUTODOWN ]");
        return;
      }

      logger.info(`Tổng số media: ${medias.length || 0}`, "[ AUTODOWN ]");

      const images: Readable[] = [];
      const videos: Readable[] = [];
      const audiosMeta: Array<{ url: string; ext: string }> = [];
      let videoCount = 0;

      for (const m of medias) {
        const url = m.url;
        const type = m.type?.toLowerCase();
        const ext = m.extension?.toLowerCase();

        if (!url) {
          logger.debug("Bỏ qua media không có URL.", "[ AUTODOWN ]");
          continue;
        }

        // Ưu tiên audio
        if (type === "audio" || ext === "mp3" || url.endsWith(".mp3")) {
          logger.debug(`Đang tải audio: ${url}`, "[ AUTODOWN ]");
          audiosMeta.push({ url, ext: "mp3" });
        }
        // Nếu là video
        else if (type === "video" || ext === "mp4") {
          if (videoCount >= 1) {
            logger.debug("Đã tải 1 video, bỏ qua phần còn lại.", "[ AUTODOWN ]");
            continue;
          }
          logger.debug(`Đang tải video: ${url}`, "[ AUTODOWN ]");
          videos.push(await streamURL(url, `video.mp4`));
          videoCount++;
        }
        // Nếu là ảnh
        else if (type === "image" || ext === "jpg" || ext === "png" || ext === "jpeg") {
          logger.debug(`Đang tải ảnh: ${url}`, "[ AUTODOWN ]");
          images.push(await streamURL(url, `image.jpg`));
        }
        // Trường hợp không rõ
        else {
          logger.debug(`Không rõ loại media này, bỏ qua: ${JSON.stringify(m)}`, "[ AUTODOWN ]");
        }
      }

      if (images.length > 0) {
        logger.info(`Gửi ${images.length} ảnh.`, "[ AUTODOWN ]");
        api.sendMessage(
          {
            body: `[${(data.source || "Autodown").toUpperCase()}] - Ảnh\n👤 Tác giả: ${data.author || "Không rõ"}\n💬 Tiêu đề: ${data.title || "Không có"}\n🔊 Thả reaction vào tin nhắn này để lấy audio (nếu có).`,
            attachment: images.length === 1 ? images[0] : images
          },
          threadID,
          (err, info) => {
            if (!err && audiosMeta.length > 0 && info?.messageID) {
              soundCache.set(info.messageID, { audiosMeta, threadID });
              // Đăng ký handleReaction để bắt reaction cho tin nhắn này
              client.handleReactions.set(info.messageID, {
                messageID: info.messageID,
                name: command.config.name,
                author: event.senderID
              });
            }
          },
          messageID
        );
      }

      if (videos.length > 0) {
        logger.info(`Tiến hành gửi video..`, "[ AUTODOWN ]");
        await new Promise<void>((resolve, reject) => {
          api.sendMessage(
            {
              body: `[${(data.source || "Autodown").toUpperCase()}] - Video\n👤 Tác giả: ${data.author || "Không rõ"}\n💬 Tiêu đề: ${data.title || "Không có"}`,
              attachment: videos[0]
            },
            threadID,
            (err) => {
              if (err) reject(err);
              else resolve();
            },
            messageID
          );
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Lỗi trong quá trình tải hoặc gửi file: ${errorMessage}`, "[ AUTODOWN ]");
    }
  },

  // Khi người dùng thả reaction vào tin nhắn ảnh, gửi lại audio (nếu có)
  handleReaction: async ({ api, event, handleReaction }: IHandleParams) => {
    const { messageID, senderID } = event;
    if (!global.autodownSoundCache || !global.autodownSoundCache.has(messageID)) return;
    if (senderID === api.getCurrentUserID()) return;

    const cacheData = global.autodownSoundCache.get(messageID);
    if (!cacheData) return;
    
    const { audiosMeta, threadID } = cacheData;
    if (!audiosMeta || audiosMeta.length === 0) return;

    // Chỉ cho phép tác giả hoặc bất kỳ? Ở đây chặn bot, cho mọi người dùng
    // Nếu muốn chỉ tác giả: if (handleReaction?.author && handleReaction.author !== senderID) return;

    try {
      const attachments: Readable[] = [];
      for (const a of audiosMeta) {
        const ext = a.ext || "mp3";
        attachments.push(await streamURL(a.url, `audio.${ext}`));
      }

      await new Promise<void>((resolve, reject) => {
        api.sendMessage(
          {
            body: `🎵 Âm thanh được yêu cầu`,
            attachment: attachments.length === 1 ? attachments[0] : attachments
          },
          threadID,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Gửi audio qua reaction thất bại: ${errorMessage}`, "[ AUTODOWN ]");
    } finally {
      if (global.autodownSoundCache) {
        global.autodownSoundCache.delete(messageID);
      }
      // Gỡ đăng ký handleReaction để tránh rác
      client.handleReactions.delete(messageID);
    }
  }
};

export = command;
