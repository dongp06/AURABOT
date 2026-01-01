import path from 'path';
import { Sequelize } from 'sequelize';

const DB_PATH = path.resolve(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false,
  define: {
    freezeTableName: true
  }
});

export default sequelize;
