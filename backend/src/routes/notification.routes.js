const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.get("/", authMiddleware, notificationController.getNotifications);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;
