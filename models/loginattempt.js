import { Sequelize } from 'sequelize';

import sequelize from '../utils/database.js';

const LoginAttempt = sequelize.define('loginAttempts', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'username'
        }
    },
    visitorId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    passwordMatched: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    fingerprintFound: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    confidence: {
        type: Sequelize.FLOAT,
        allowNull: true,
    },
    ip: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    city: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    country: {
        type: Sequelize.STRING,
        allowNull: true,
    }
});

export default LoginAttempt;