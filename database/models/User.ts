import { DataTypes, Model } from 'sequelize';
import sequelize from '../sequelize';

interface UserAttributes {
  uid: string;
  name: string;
  info?: Record<string, unknown>;
  gender: string;
  money: number;
  exp: number;
}

class User extends Model<UserAttributes> implements UserAttributes {
  public uid!: string;
  public name!: string;
  public info?: Record<string, unknown>;
  public gender!: string;
  public money!: number;
  public exp!: number;
}

User.init({
  uid: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: "Người dùng Facebook"
  },
  info: {
    type: DataTypes.JSON,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    defaultValue: "Unknown"
  },
  money: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  exp: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  tableName: 'User'
});

export default User;
