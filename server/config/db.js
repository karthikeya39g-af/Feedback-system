const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering
        };

        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            console.warn("MONGO_URI not defined in environment variables. Database features will fail.");
            // Return null or throw? For now, allowing graceful failure or local fallback if we implemented it, 
            // but effectively this means no DB.
            return null;
        }

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log("MongoDB Connected Successfully");
            return mongoose;
        }).catch(err => {
            console.error("MongoDB Connection Error:", err);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null; // Reset promise on failure so we can retry
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;
