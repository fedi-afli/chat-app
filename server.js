require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const http = require('http');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { encrypt, decrypt } = require('./utils/crypto');
const Message = require('./models/Message');
const User = require('./models/User');

// Routes
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`📢 Request received: ${req.method} ${req.url}`);
    next();
});

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

const activeUsers = {}; // Stores socket.id -> { username, nickname }

io.on('connection', (socket) => {

    // 🟢 JOIN ROOM 
    socket.on('joinRoom', async ({ username, nickname }) => {
        // 👇 Safety: If nickname is missing (e.g. fresh signup), use username
        const displayNickname = nickname || username;

        // Store both
        activeUsers[socket.id] = { username, nickname: displayNickname };

        try {
            // 1. Mark OLD messages as seen (Using Username for uniqueness)
            await Message.updateMany(
                { username: { $ne: username }, seenBy: { $ne: username } },
                { $push: { seenBy: username } }
            );

            // 2. Load History
            const rawMessages = await Message.find().sort({ createdAt: 1 });
            const history = rawMessages.map(msg => ({
                _id: msg._id,
                username: msg.username,
                nickname: msg.nickname || msg.username, 
                text: decrypt(msg.text),
                seenBy: msg.seenBy || []
            }));

            socket.emit('loadMessages', history);
            io.emit('messagesSeen', { username });

        } catch (err) { console.error(err); }

        // Notify others
        socket.broadcast.emit('message', {
            username: 'System',
            text: `${displayNickname} has joined the chat`, 
            type: 'system'
        });

        // Send active users list (Send nicknames)
        io.emit('roomUsers', { 
            users: Object.values(activeUsers).map(u => u.nickname) 
        });
    });

    // 🔵 CHAT MESSAGE
    socket.on('chatMessage', async (msg) => {
        const currentUser = activeUsers[socket.id];
        if (!currentUser) return; 

        try {
            const encryptedText = encrypt(msg);
            
            // Save to DB
            const newMessage = new Message({ 
                username: currentUser.username, 
                nickname: currentUser.nickname, 
                text: encryptedText,
                seenBy: [currentUser.username]
            });
            await newMessage.save();

            // Emit to everyone
            io.emit('message', {
                _id: newMessage._id, 
                username: currentUser.username,
                nickname: currentUser.nickname, 
                text: msg,
                type: 'chat',
                seenBy: [currentUser.username]
            });

        } catch (err) { console.error(err); }
    });

    // 👇 SEEN EVENT 
    socket.on('markRead', async ({ messageId }) => {
        const currentUser = activeUsers[socket.id];
        if (!currentUser) return;

        try {
            await Message.findByIdAndUpdate(messageId, {
                $addToSet: { seenBy: currentUser.username }
            });

            io.emit('messageReadUpdate', { 
                messageId: messageId, 
                username: currentUser.username 
            });
            
        } catch (err) { console.error(err); }
    });
    // 🟡 CHANGE NICKNAME LISTENER
    socket.on('changeNickname', async (newNick) => {
        const currentUser = activeUsers[socket.id];
        if (!currentUser) return;

        try {
            const oldNick = currentUser.nickname;
            
            // 1. Update in Database (Persistent change)
            await User.findOneAndUpdate(
                { username: currentUser.username }, 
                { nickname: newNick }
            );

            // 2. Update active session in memory
            activeUsers[socket.id].nickname = newNick;

            // 3. Notify the specific user (Updates their UI immediately)
            socket.emit('nicknameUpdated', newNick);

            // 4. Update User List for everyone else
            io.emit('roomUsers', { 
                users: Object.values(activeUsers).map(u => u.nickname) 
            });

            // 5. System Alert
            io.emit('message', {
                username: 'System',
                text: `${oldNick} changed their name to ${newNick}`,
                type: 'system'
            });

        } catch (err) {
            console.error("Error changing nickname:", err);
        }
    });
    socket.on('forceChangeNickname', async ({ targetName, newNick }) => {
        
        // 1. Find the Socket ID of the person we want to change
        // (We look through activeUsers to find who matches 'targetName')
        const targetSocketId = Object.keys(activeUsers).find(
            id => activeUsers[id].nickname === targetName
        );

        if (targetSocketId) {
            // 2. Update Server Memory
            const userObj = activeUsers[targetSocketId];
            userObj.nickname = newNick;

            // 3. Update Database (So it saves forever)
            try {
                await User.findOneAndUpdate(
                    { username: userObj.username }, 
                    { nickname: newNick }
                );
            } catch (err) { console.error(err); }

            // 4. Update the list for everyone immediately
            io.emit('roomUsers', { 
                users: Object.values(activeUsers).map(u => u.nickname) 
            });
            
            // 5. Tell the specific user their name changed (so their own UI updates)
            io.to(targetSocketId).emit('nicknameUpdated', newNick);
        }
    });

    // 🔴 DISCONNECT
    socket.on('disconnect', () => {
        const currentUser = activeUsers[socket.id];
        if (currentUser) {
            io.emit('message', { 
                username: 'System', 
                text: `${currentUser.nickname} has left`, 
                type: 'system' 
            });
            
            delete activeUsers[socket.id];
            
            io.emit('roomUsers', { 
                users: Object.values(activeUsers).map(u => u.nickname) 
            });
        }
    });
});

const Port = process.env.PORT || 3000;

// 👇 FIX: Was 'sever.listen', changed to 'server.listen'
server.listen(Port, () => console.log(`🚀 Server running on port http://localhost:${Port}`));