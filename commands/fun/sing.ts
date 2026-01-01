import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { client } from '../../src/client';
import { EXTERNAL_API_KEY, EXTERNAL_API_URL } from '../../src/config';
import { ICommand, IHandleParams, IRunParams } from '../../types';

const API_URL = `${EXTERNAL_API_URL}/api/v1/youtube/search`;
const DOWNLOAD_API_URL = `${EXTERNAL_API_URL}/api/v1/youtube/download`;
const API_KEY = EXTERNAL_API_KEY;
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

interface YouTubeVideo {
  type: string;
  videoId?: string;
  id?: string;
  listId?: string;
  url: string;
  title: string;
  author: string;
  thumbnail: string;
  views?: number;
  viewsCount?: number;
  timestamp?: string;
  seconds?: number;
  ago?: string;
}

interface YouTubeResponse {
  status: number;
  query: string;
  data: {
    videos?: YouTubeVideo[];
    live?: YouTubeVideo[];
    playlists?: YouTubeVideo[];
    channels?: YouTubeVideo[];
    all?: YouTubeVideo[];
  };
}

interface DownloadAttachment {
  type: "Video" | "Audio";
  url: string;
  quality?: string;
  mimeType?: string;
  size?: string;
  bitrate?: number;
  videoOnly?: boolean;
}

interface DownloadResponse {
  status: number;
  data: {
    id: string;
    message: string;
    author: string;
    duration: string;
    views: string;
    likes: number;
    comments: number;
    thumbnail: string;
    attachments: DownloadAttachment[];
  };
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatViews = (views?: number): string => {
  if (!views) return 'N/A';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

interface StreamResult {
  stream: Readable;
  size: number;
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
};

const tempRoot = (): string => {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

async function getStreamAndSize(url: string, headers: Record<string, string> = {}): Promise<StreamResult> {
  const requestHeaders: Record<string, string> = {
    Range: "bytes=0-",
    ...headers,
  };

  // Add YouTube cookie if available
  if (global.cookie?.youtube) {
    requestHeaders.Cookie = global.cookie.youtube;
  }

  const res = await axios.get(url, {
    responseType: "stream",
    headers: requestHeaders,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const len = Number(res.headers["content-length"] || 0);
  const cr = res.headers["content-range"];
  const total = cr ? Number(String(cr).split("/").pop()) : len;

  return { stream: res.data, size: total || len };
}

async function headTotal(url: string): Promise<number> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
      Accept: "*/*",
      Referer: "https://www.youtube.com/",
      Range: "bytes=0-0",
    };

    // Add YouTube cookie if available
    if (global.cookie?.youtube) {
      headers.Cookie = global.cookie.youtube;
    }

    const res = await axios.get(url, { responseType: "stream", headers });
    const cr = res.headers["content-range"];
    const total = cr ? Number(String(cr).split("/").pop()) : Number(res.headers["content-length"] || 0);
    res.data.destroy();
    return total || 0;
  } catch {
    return 0;
  }
}

async function downloadAudio(audioUrl: string, outputPath: string): Promise<{ path: string; size: number }> {
  const headers: Record<string, string> = {
    "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
    Accept: "*/*",
    Referer: "https://www.youtube.com/",
  };

  // Add YouTube cookie if available
  if (global.cookie?.youtube) {
    headers.Cookie = global.cookie.youtube;
  }

  const { stream, size } = await getStreamAndSize(audioUrl, headers);
  const writeStream = fs.createWriteStream(outputPath);

  await new Promise<void>((resolve, reject) => {
    stream.pipe(writeStream);
    writeStream.on("finish", () => {
      // Cleanup streams ngay sau khi xong
      if (stream && typeof stream.destroy === 'function') stream.destroy();
      writeStream.destroy();
      resolve();
    });
    writeStream.on("error", (err: Error) => {
      if (stream && typeof stream.destroy === 'function') stream.destroy();
      writeStream.destroy();
      reject(err);
    });
    stream.on("error", (err: Error) => {
      if (stream && typeof stream.destroy === 'function') stream.destroy();
      writeStream.destroy();
      reject(err);
    });
  });

  return { path: outputPath, size };
}

const command: ICommand = {
  config: {
    name: "sing",
    version: "1.0.0",
    author: "DongDev",
    description: "Tìm kiếm video YouTube",
    category: "Fun",
    usages: "!sing <từ khóa> [hl=vi] [gl=VN]"
  },

  run: async ({ api, event, args, reply }: IRunParams) => {
    try {
      // Parse arguments
      const queryParts: string[] = [];
      let hl = 'vi';
      let gl = 'VN';

      for (const arg of args) {
        if (arg.startsWith('hl=')) {
          hl = arg.split('=')[1] || 'vi';
        } else if (arg.startsWith('gl=')) {
          gl = arg.split('=')[1] || 'VN';
        } else {
          queryParts.push(arg);
        }
      }

      const query = queryParts.join(' ').trim();

      if (!query) {
        await reply('⚠️ Vui lòng nhập từ khóa tìm kiếm!\n📝 Ví dụ: !sing javascript tutorial');
        return;
      }

      // Show loading
      await reply('🔍 Đang tìm kiếm...');

      // Make API request
      const response = await axios.get(API_URL, {
        params: {
          query: query,
          hl: hl,
          gl: gl
        },
        headers: {
          'X-API-Key': API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
        }
      });

      const apiResponse: YouTubeResponse = response.data;

      // Check if response is successful
      if (apiResponse.status !== 200 || !apiResponse.data) {
        throw new Error('API trả về dữ liệu không hợp lệ');
      }

      // Format results
      let message = `🎵 Kết quả tìm kiếm: "${apiResponse.query || query}"\n\n`;

      // Filter videos: only videos under 15 minutes (900 seconds)
      const allVideos = apiResponse.data.videos || [];
      const filteredVideos = allVideos.filter((video) => {
        // Only include videos with seconds < 900 (15 minutes)
        return video.seconds && video.seconds < 900;
      });

      // Limit to 6 results
      const selectedVideos = filteredVideos.slice(0, 6);

      if (selectedVideos.length === 0) {
        message = `❌ Không tìm thấy video nào dưới 15 phút cho "${query}"`;
        await reply(message);
        return;
      }

      message += `📹 VIDEOS (${selectedVideos.length}):\n`;
      selectedVideos.forEach((video, index) => {
        const views = formatViews(video.views || video.viewsCount);
        const duration = formatDuration(video.seconds);
        const ago = video.ago ? ` | 📅 ${video.ago}` : '';
        message += `\n${index + 1}. ${video.title}\n`;
        message += `   👤 Tác giả: ${video.author}\n`;
        message += `   👁️ Lượt xem: ${views} | ⏱️ Thời lượng: ${duration}${ago}\n`;
      });

      message += `\n\n💡 Reply số thứ tự để chọn bài hát (ví dụ: reply "1")`;

      // Send message and save handleReply
      api.sendMessage(message, event.threadID, (err, info) => {
        if (err || !info) return;

        client.handleReplies.set(info.messageID, {
          messageID: info.messageID,
          name: "sing",
          author: event.senderID,
          videos: selectedVideos
        });
      });

    } catch (error: unknown) {
      console.error('Sing command error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await reply(`❌ Lỗi khi tìm kiếm: ${errorMessage}`);
    }
  },

  handleReply: async ({ api, event, handleReply, send }: IHandleParams) => {
    if (!handleReply) return;

    // Check if it's the same user
    if (event.senderID !== handleReply.author) {
      await send('⚠️ Chỉ người tìm kiếm mới có thể chọn bài!');
      return;
    }

    const videos = (handleReply.videos as YouTubeVideo[]) || [];
    if (videos.length === 0) {
      await send('❌ Không có danh sách video để chọn!');
      client.handleReplies.delete(handleReply.messageID);
      return;
    }

    // Parse the selected number
    const eventBody = 'body' in event ? (event.body as string | undefined) : undefined;
    const body = eventBody?.trim() || '';
    const selectedNum = parseInt(body);

    if (isNaN(selectedNum) || selectedNum < 1 || selectedNum > videos.length) {
      await send(`⚠️ Vui lòng chọn số từ 1 đến ${videos.length}!\n📝 Ví dụ: reply "1"`);
      return;
    }

    const selectedVideo = videos[selectedNum - 1];
    if (!selectedVideo) {
      await send('❌ Không tìm thấy video!');
      return;
    }

    const videoUrl = selectedVideo.url;
    const videoId = selectedVideo.videoId || selectedVideo.id;

    if (!videoUrl && !videoId) {
      await send('❌ Không tìm thấy URL video!');
      return;
    }

    // Show downloading message
    await send('⬇️ Đang tải audio...');

    try {
      // Get download info from API
      const downloadUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
      const downloadResponse = await axios.get(DOWNLOAD_API_URL, {
        params: {
          url: downloadUrl
        },
        headers: {
          'X-API-Key': API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
        }
      });

      const downloadData: DownloadResponse = downloadResponse.data;

      if (downloadData.status !== 200 || !downloadData.data) {
        throw new Error('API trả về dữ liệu không hợp lệ');
      }

      // Find audio attachment
      const audioAttachment = downloadData.data.attachments.find(
        (att) => att.type === 'Audio'
      );

      if (!audioAttachment || !audioAttachment.url) {
        throw new Error('Không tìm thấy audio stream');
      }

      // Check estimated size from API response
      const sizeStr = audioAttachment.size?.replace(/\./g, '') || '0';
      const estimatedSize = parseInt(sizeStr);
      if (estimatedSize > MAX_SIZE) {
        throw new Error(`File quá lớn (${(estimatedSize / 1024 / 1024).toFixed(2)}MB > 25MB)`);
      }

      // Check actual size via HEAD request
      const actualSize = await headTotal(audioAttachment.url);
      if (actualSize > 0 && actualSize > MAX_SIZE) {
        throw new Error(`File quá lớn (${(actualSize / 1024 / 1024).toFixed(2)}MB > 25MB)`);
      }

      // Download audio file
      const sanitizedTitle = sanitizeFileName(downloadData.data.message || selectedVideo.title);
      const base = path.join(tempRoot(), sanitizedTitle);
      const outputPath = `${base}_${Date.now()}.mp3`;

      const downloadResult = await downloadAudio(audioAttachment.url, outputPath);

      // Final size check
      if (downloadResult.size > MAX_SIZE) {
        try {
          fs.unlinkSync(outputPath);
        } catch {
          // Ignore errors
        }
        throw new Error(`File quá lớn (${(downloadResult.size / 1024 / 1024).toFixed(2)}MB > 25MB)`);
      }

      // Prepare message
      const views = formatViews(selectedVideo.views || selectedVideo.viewsCount);
      let resultMessage = `🎵 ${downloadData.data.message || selectedVideo.title}\n`;
      resultMessage += `👤 ${downloadData.data.author || selectedVideo.author}\n`;
      resultMessage += `⏱️ ${downloadData.data.duration || formatDuration(selectedVideo.seconds)}\n`;
      resultMessage += `👁️ ${downloadData.data.views || views}`;

      // Send file as attachment
      const readStream = fs.createReadStream(outputPath);

      api.sendMessage(
        {
          body: resultMessage,
          attachment: readStream
        },
        event.threadID,
        async (err) => {
          // Cleanup
          readStream.destroy();
          setTimeout(() => {
            try {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            } catch {
              // Ignore errors
            }
          }, 10000);

          if (err) {
            console.error('Error sending audio:', err);
            try {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            } catch {
              // Ignore errors
            }
          }
        }
      );

      // Clean up
      client.handleReplies.delete(handleReply.messageID);

    } catch (error: unknown) {
      console.error('Download audio error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await send(`❌ Lỗi khi tải audio: ${errorMessage}`);
    }
  }
};

export = command;
