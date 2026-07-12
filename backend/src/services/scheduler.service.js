const cron = require("node-cron");
const notificationService = require("./notification.service");

let scheduledTask = null;

function startNotificationScheduler() {
    if (scheduledTask) {
        return;
    }

    // Run at startup, then every hour
    notificationService.runNotificationChecks().catch((error) => {
        console.error("Initial notification check failed:", error.message);
    });

    scheduledTask = cron.schedule("0 * * * *", () => {
        notificationService.runNotificationChecks().catch((error) => {
            console.error("Scheduled notification check failed:", error.message);
        });
    });

    console.log("Notification scheduler started (runs hourly)");
}

function stopNotificationScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
    }
}

module.exports = {
    startNotificationScheduler,
    stopNotificationScheduler,
};
