require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const http = require('http');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { encrypt, decrypt } = require('./utils/crypto');
const Message = require('./models/Message');

// Routes
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');

const app = express();
app.use((req, res, next) => {
    console.log(`📢 Request received: ${req.method} ${req.url}`);
    next();
});
// -----------------------------


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

    socket.on('joinRoom', async ({ username }) => {
        activeUsers[socket.id] = username;

        // 👇 1. LOAD & DECRYPT OLD MESSAGES
        try {
            const rawMessages = await Message.find().sort({ createdAt: 1 });
            
            // Convert database messages to readable text
            const history = rawMessages.map(msg => ({
                username: msg.username,
                text: decrypt(msg.text), // 🔓 Decrypt here!
                createdAt: msg.createdAt
            }));

            socket.emit('loadMessages', history);
        } catch (err) {
            console.error("Error loading messages:", err);
        }

        // Notify others
        socket.broadcast.emit('message', {
            username: 'System',
            text: `${username} has joined the chat`,
            type: 'system'
        });

        io.emit('roomUsers', { users: Object.values(activeUsers) });
    });

    // 👇 2. ENCRYPT & SAVE NEW MESSAGES
    socket.on('chatMessage', async (msg) => {
        const user = activeUsers[socket.id];
        
        try {
            // 🔒 Encrypt before saving
            const encryptedText = encrypt(msg);
            
            const newMessage = new Message({ 
                username: user, 
                text: encryptedText 
            });
            await newMessage.save();

            // Emit the PLAIN text to currently connected users
            // (No need to decrypt because we just received it!)
            io.emit('message', {
                username: user,
                text: msg,
                type: 'chat'
            });
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        const username = activeUsers[socket.id];
        if (username) {
            io.emit('message', { username: 'System', text: `${username} has left`, type: 'system' });
            delete activeUsers[socket.id];
            io.emit('roomUsers', { users: Object.values(activeUsers) });
        }
    });
});
Port=process.env.PORT || 3000;

server.listen(Port, () => console.log(`🚀 Server running on port http://localhost:${Port}`));