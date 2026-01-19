const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // ⚠️ Make sure you installed this: npm install bcrypt

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters'],
    },
    nickname: {
        type: String, 
        default: '' 
    }
});

// 👇 FIX: Removed 'next' parameter. Modern Mongoose doesn't need it with async/await.
userSchema.pre('save', async function() {
    // 1. Handle Nickname
    if (!this.nickname) {
        this.nickname = this.username;
    }

    // 2. Hash Password (only if modified)
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Static method to login user
userSchema.statics.login = async function(username, password) {
    const user = await this.findOne({ username });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error('incorrect password');
    }
    throw Error('incorrect username');
};

const User = mongoose.model('User', userSchema);
module.exports = User;