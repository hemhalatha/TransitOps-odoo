require("dotenv").config();
const app = require("./src/app.js");
const connectDB = require("./src/config/db.js");
const { startNotificationScheduler } = require("./src/services/scheduler.service");

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDB();
    startNotificationScheduler();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});