const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Make sure this path is correct

// ⚠️ Use your FIXED connection string here (with /chatapp)
const MONGO_URI = "mongodb+srv://fediaflii:NSksvh33e59KYCGF@cluster0.yzmjie7.mongodb.net/?appName=Cluster0/chatapp";

const createSpecificUser = async () => {
    try {
        // 1. Connect to Database
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Hash the password "990"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('99016887', salt);

        // 3. Create the user
        const newUser = await User.create({
            username: 'fediii',
            password: hashedPassword
        });

        console.log('🎉 User created successfully!');
        console.log('Username: fediii');
        console.log('Password: 990');

    } catch (err) {
        if (err.code === 11000) {
            console.log('⚠️ User "fediii" already exists.');
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        // 4. Disconnect
        mongoose.connection.close();
    }
};

createSpecificUser();