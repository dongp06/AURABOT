import { logger } from '../src/utils/logger';
import sequelize from './sequelize';
import Thread from './models/Thread';
import User from './models/User';

const loadCache = async (): Promise<void> => {
  try {
    const { client } = await import('../src/client');

    const users = await User.findAll({ attributes: ['uid'] });
    users.forEach(user => {
      client.data.users.add(user.uid);
    });

    const threads = await Thread.findAll({ attributes: ['threadID'] });
    threads.forEach(thread => {
      client.data.threads.add(thread.threadID);
    });

  } catch (error) {
    logger.warn('⚠️ Không thể load cache từ database:', error);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await loadCache();
  } catch (error) {
    logger.error('❌ Không thể kết nối Database:', error);
    throw error;
  }
};

export default sequelize;
export { sequelize };
