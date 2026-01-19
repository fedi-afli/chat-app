
const mongoose = require('mongoose');



const connectDB = async () => {
    try {
        // 👇 Read from the .env file
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'chatapp' });
        console.log('✅ MongoDB Connected to: chatapp');
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;