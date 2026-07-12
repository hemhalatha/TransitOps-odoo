const notificationService = require("../services/notification.service");

// GET /api/notifications — list notifications for the current user
async function getNotifications(req, res) {
    try {
        const unreadOnly = req.query.unread === "true";
        const notifications = await notificationService.getNotificationsForUser(req.user, {
            unreadOnly,
        });

        res.status(200).json({
            status: true,
            count: notifications.length,
            notifications,
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/notifications/unread-count — unread badge count
async function getUnreadCount(req, res) {
    try {
        const unreadCount = await notificationService.getUnreadCountForUser(req.user);

        res.status(200).json({
            status: true,
            unreadCount,
        });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PATCH /api/notifications/:id/read — mark a single notification as read
async function markAsRead(req, res) {
    try {
        const notification = await notificationService.markNotificationRead(
            req.params.id,
            req.user
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                status: false,
            });
        }

        res.status(200).json({
            status: true,
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PATCH /api/notifications/read-all — mark all notifications as read
async function markAllAsRead(req, res) {
    try {
        const modifiedCount = await notificationService.markAllNotificationsRead(req.user);

        res.status(200).json({
            status: true,
            message: "All notifications marked as read",
            modifiedCount,
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
