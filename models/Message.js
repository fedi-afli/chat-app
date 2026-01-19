const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    nickname: { type: String },
    text: { type: String, required: true },
    
    // 👇 ADD THIS FIELD
    messageType: { 
        type: String, 
        default: 'text' // 'text' or 'image'
    },
    
    seenBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);