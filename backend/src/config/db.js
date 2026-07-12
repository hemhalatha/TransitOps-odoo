const mongoose = require("mongoose");

const MAX_RETRIES = Number(process.env.MONGO_CONNECT_RETRIES || 10);
const RETRY_DELAY_MS = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 1000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB() {
    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is required to connect to MongoDB");
    }

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            await mongoose.connect(process.env.MONGO_URL);
            console.log("MongoDB connected");
            return;
        } catch (error) {
            lastError = error;

            if (attempt < MAX_RETRIES) {
                console.log(`MongoDB connection failed. Retrying ${attempt}/${MAX_RETRIES}...`);
                await wait(RETRY_DELAY_MS);
            }
        }
    }

    throw new Error(`Unable to connect to MongoDB after ${MAX_RETRIES} attempts: ${lastError.message}`);
}

module.exports = connectDB;