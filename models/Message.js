const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    nickname: { type: String }, // 👈 Fix: Removed 'required: true' for safety
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    seenBy: [{ type: String }]
});

module.exports = mongoose.model('Message', messageSchema);