import type { IFCAU_API, IFCAU_Thread, IFCAU_User } from '@dongdev/fca-unofficial';
import { client } from '../src/client';
import { logger } from '../src/utils/logger';
import type { MessageEventType } from '../types';
import Thread from './models/Thread';
import User from './models/User';

function parseGender(gender: unknown): string {
  if (typeof gender === 'number') {
    return gender === 2 ? "Nam" : (gender === 1 ? "Nữ" : "Unknown");
  }
  if (typeof gender === 'string') {
    const upperGender = gender.toUpperCase();
    return upperGender === "MALE" ? "Nam" : (upperGender === "FEMALE" ? "Nữ" : "Unknown");
  }
  return "Unknown";
}

export default async function handleCreateData(
  api: IFCAU_API,
  event: MessageEventType
): Promise<void> {
  const { senderID, threadID, isGroup } = event;

  try {
    if (threadID && isGroup && !client.data.threads.has(threadID)) {
      const threadInfo: IFCAU_Thread | null = await new Promise((resolve) => {
        api.getThreadInfo(threadID, (err: Error | null, info: IFCAU_Thread | null) => {
          if (err) {
            logger.warn(`Không thể lấy thông tin thread ${threadID}:`, err);
            return resolve(null);
          }
          resolve(info);
        });
      });

      if (!threadInfo) {
        logger.warn(`Không thể lấy thông tin thread ${threadID}`);
        return;
      }

      const threadName = threadInfo.threadName || "Nhóm không tên";

      await Thread.findOrCreate({
        where: { threadID: threadID },
        defaults: {
          threadID: threadID,
          name: threadName,
          info: threadInfo as Record<string, unknown>,
          prefix: "!",
          rankup: false
        }
      });

      const thread = await Thread.findByPk(threadID);
      if (thread && thread.name === "Nhóm chưa đặt tên") {
        thread.name = threadName;
        thread.info = threadInfo as Record<string, unknown>;
        await thread.save();
      }

      const userInfoArray = threadInfo.userInfo || [];
      const participantIDs = threadInfo.participantIDs || [];

      const userInfoMap = new Map<string, IFCAU_User & { id: string }>();
      for (const user of userInfoArray) {
        if (user.id) {
          userInfoMap.set(user.id, user);
        }
      }

      for (const participantID of participantIDs) {
        if (!client.data.users.has(participantID)) {
          let userInfo: (IFCAU_User & { id: string }) | null = null;

          if (userInfoMap.has(participantID)) {
            userInfo = userInfoMap.get(participantID) || null;
          } else {
            const userInfoResult: Record<string, IFCAU_User> = await new Promise((resolve) => {
              api.getUserInfo(participantID, (err: Error | null, ret: Record<string, IFCAU_User> | null) => {
                if (err) {
                  logger.warn(`Không thể lấy thông tin user ${participantID}:`, err);
                  return resolve({});
                }
                resolve((ret || {}) as Record<string, IFCAU_User>);
              });
            });
            const fetchedUser = userInfoResult[participantID];
            if (fetchedUser) {
              userInfo = { ...fetchedUser, id: participantID };
            }
          }

          if (userInfo) {
            const name = userInfo.name || "Người dùng Facebook";
            const gender = parseGender(userInfo.gender);

            const [user, created] = await User.findOrCreate({
              where: { uid: participantID },
              defaults: {
                uid: participantID,
                name: name,
                gender: gender,
                info: userInfo as Record<string, unknown>,
                money: 0,
                exp: 0
              }
            });

            if (!created && (user.name === "Người dùng Facebook" || user.gender === "Unknown" || !user.info)) {
              user.name = name;
              user.gender = gender;
              user.info = userInfo as Record<string, unknown>;
              await user.save();
              logger.info(`🔄 Updated User: ${name} (${participantID})`);
            } else if (created) {
              logger.info(`👤 New User: ${name} (${participantID})`);
            }

            client.data.users.add(participantID);
          }
        }
      }

      client.data.threads.add(threadID);
      logger.info(`🏠 New Group: ${threadName} (${threadID})`);
    }

    if (senderID) {
      const existingUser = await User.findByPk(senderID);

      if (isGroup && !existingUser) {
        const userInfoResult: Record<string, IFCAU_User> = await new Promise((resolve) => {
          api.getUserInfo(senderID, (err: Error | null, ret: Record<string, IFCAU_User> | null) => {
            if (err) {
              logger.warn(`Không thể lấy thông tin user ${senderID}:`, err);
              return resolve({});
            }
            resolve((ret || {}) as Record<string, IFCAU_User>);
          });
        });

        const userInfo = userInfoResult[senderID];
        if (userInfo) {
          const name = userInfo.name || "Người dùng Facebook";
          const gender = parseGender(userInfo.gender);

          await User.create({
            uid: senderID,
            name: name,
            gender: gender,
            info: userInfo as Record<string, unknown>,
            money: 0,
            exp: 0
          });

          client.data.users.add(senderID);
          logger.info(`👤 New User (from group chat): ${name} (${senderID})`);
        }
      }
      else if (!isGroup && !client.data.users.has(senderID)) {
        const userInfoResult: Record<string, IFCAU_User> = await new Promise((resolve) => {
          api.getUserInfo(senderID, (err: Error | null, ret: Record<string, IFCAU_User> | null) => {
            if (err) {
              logger.warn(`Không thể lấy thông tin user ${senderID}:`, err);
              return resolve({});
            }
            resolve((ret || {}) as Record<string, IFCAU_User>);
          });
        });

        const userInfo = userInfoResult[senderID];
        if (userInfo) {
          const name = userInfo.name || "Người dùng Facebook";
          const gender = parseGender(userInfo.gender);

          const [user, created] = await User.findOrCreate({
            where: { uid: senderID },
            defaults: {
              uid: senderID,
              name: name,
              gender: gender,
              info: userInfo as Record<string, unknown>,
              money: 0,
              exp: 0
            }
          });

          if (!created && (user.name === "Người dùng Facebook" || user.gender === "Unknown" || !user.info)) {
            user.name = name;
            user.gender = gender;
            user.info = userInfo as Record<string, unknown>;
            await user.save();
            logger.info(`🔄 Updated User: ${name} (${senderID})`);
          } else if (created) {
            logger.info(`👤 New User: ${name} (${senderID})`);
          }

          client.data.users.add(senderID);
        }
      } else if (existingUser && !client.data.users.has(senderID)) {
        client.data.users.add(senderID);
      }
    }
  } catch (error) {
    logger.error("❌ Lỗi tạo Data:", error);
  }
}
