const mongoose = require("mongoose");

async function connectDB() {
    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is required to connect to MongoDB");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
}

module.exports = connectDB;