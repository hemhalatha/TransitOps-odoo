const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditLog.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

router.get(
    "/",
    authMiddleware,
    authorize("manager"),
    auditLogController.getAuditLogs
);

module.exports = router;
