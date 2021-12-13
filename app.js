import express from 'express';

import dotenv from "dotenv";

dotenv.config();

import sequelize from './utils/database.js';

import router from './routes/routes.js';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(router);

sequelize.sync({ force: true }); 

app.listen(5000);
