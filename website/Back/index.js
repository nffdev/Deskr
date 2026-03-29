const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const connectionsRouter = require('./routes/connections');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://192.168.1.80:5173'],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));

app.use(cors({
    origin: ['http://localhost:5173', 'http://192.168.1.80:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.set('io', io);

const base_route = '/api/v1';

const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
app.use(base_route + '/users', usersRoutes);
app.use(base_route + '/auth', authRoutes);
app.use(base_route + '/connections', connectionsRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

server.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}`))

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Connected to mongodb');
    })
    .catch(err => console.log(`Error to connect to mongodb: ${err}`));

io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        // console.log('Client disconnected:', socket.id);
    });
});

process
    .setMaxListeners(0)
    .on("uncaughtException", err => console.error(err))
    .on("unhandledRejection", err => console.error(err));