const mongoose = require('mongoose');


const MONGO_URI = "mongodb+srv://fediaflii:NSksvh33e59KYCGF@cluster0.yzmjie7.mongodb.net/?appName=Cluster0/chat_app";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected to: chatapp');
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;