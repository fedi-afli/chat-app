const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const http = require('http');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Connect Database
connectDB();

// Routes
app.use(viewRoutes);
app.use(authRoutes);

// Socket.io Logic
const activeUsers = {}; // Map socket.id to username

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    // 1. User Joins
    socket.on('joinRoom', ({ username }) => {
        activeUsers[socket.id] = username;

        // Broadcast to others that user joined
        socket.broadcast.emit('message', {
            username: 'System',
            text: `${username} has joined the chat`,
            type: 'system'
        });

        // Update user list for everyone
        io.emit('roomUsers', {
            users: Object.values(activeUsers)
        });
    });

    // 2. Listen for Chat Messages
    socket.on('chatMessage', (msg) => {
        const user = activeUsers[socket.id];
        // Emit to everyone including sender
        io.emit('message', {
            username: user,
            text: msg,
            type: 'chat'
        });
    });

    // 3. User Disconnects
    socket.on('disconnect', () => {
        const username = activeUsers[socket.id];
        if (username) {
            io.emit('message', {
                username: 'System',
                text: `${username} has left the chat`,
                type: 'system'
            });

            delete activeUsers[socket.id];

            // Update user list
            io.emit('roomUsers', {
                users: Object.values(activeUsers)
            });
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));