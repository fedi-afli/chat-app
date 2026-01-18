const mongoose = require('mongoose');


const MONGO_URI = "mongodb+srv://f3diafli_db_user:kb6Uci9v2hrHbMLI@cluster0.yzmjie7.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;