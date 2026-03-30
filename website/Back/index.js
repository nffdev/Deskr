const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));

app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
    methods: ['GET', 'POST']
}));

const { globalLimiter } = require('./middleware/rateLimiter');
app.use(globalLimiter);

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

server.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}`));

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Connected to mongodb');
    })
    .catch(err => console.log(`Error to connect to mongodb: ${err}`));

const base_route = '/api/v1';

const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const buildRoutes = require('./routes/build');
const connectionsRoutes = require('./routes/connections');
app.use(base_route + '/users', usersRoutes);
app.use(base_route + '/auth', authRoutes);
app.use(base_route + '/build', buildRoutes);
app.use(base_route + '/connections', connectionsRoutes);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

process
    .setMaxListeners(0)
    .on("uncaughtException", err => console.error(err))
    .on("unhandledRejection", err => console.error(err));