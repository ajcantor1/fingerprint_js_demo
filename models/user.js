import { Sequelize } from 'sequelize';

import sequelize from '../utils/database.js';

const User = sequelize.define('users', {
   username: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
   },
   firstName: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   lastName: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   password: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   locked: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
   },
   lockedTill: {
      type: Sequelize.DATE,
      allowNull: true,
   },
});

export default User;
