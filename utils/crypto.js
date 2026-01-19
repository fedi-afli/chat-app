const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const key = process.env.CRYPTO_KEY; // Must be 32 chars
const ivLength = 16; // Initialization vector length

// Encrypt Function
function encrypt(text) {
    if (!key || key.length !== 32) {
        throw new Error("CRYPTO_KEY must be exactly 32 characters long in .env");
    }
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Return format: "IV:EncryptedData"
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt Function
function decrypt(text) {
    if (!text) return "";
    // If text doesn't look encrypted (no colon), return it as is (prevents crashes)
    if (!text.includes(':')) return text; 

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        return "[Error: Could not decrypt message]";
    }
}

module.exports = { encrypt, decrypt };