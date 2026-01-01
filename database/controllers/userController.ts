import User from '../models/User';

export const Users = {
  getData: async (uid: string, name?: string, gender?: string): Promise<User> => {
    const [user, created] = await User.findOrCreate({
      where: { uid },
      defaults: {
        uid,
        name: name || "Người dùng Facebook",
        gender: gender || "Unknown",
        money: 0,
        exp: 0
      }
    });

    let updated = false;
    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }
    if (gender && user.gender !== gender) {
      user.gender = gender;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    return user;
  },

  addMoney: async (uid: string, amount: number): Promise<number> => {
    const user = await Users.getData(uid);
    user.money += amount;
    await user.save();
    return user.money;
  },

  decreaseMoney: async (uid: string, amount: number): Promise<boolean> => {
    const user = await Users.getData(uid);
    if (user.money < amount) return false;
    user.money -= amount;
    await user.save();
    return true;
  },

  addExp: async (uid: string, amount: number): Promise<number> => {
    const user = await Users.getData(uid);
    user.exp += amount;
    await user.save();
    return user.exp;
  },

  getInfo: async (uid: string): Promise<User | null> => {
    return await User.findByPk(uid);
  },

  getTopMoney: async (limit: number = 10): Promise<User[]> => {
    return await User.findAll({
      order: [['money', 'DESC']],
      limit
    });
  },

  getTopExp: async (limit: number = 10): Promise<User[]> => {
    return await User.findAll({
      order: [['exp', 'DESC']],
      limit
    });
  }
};
