const auditLogService = require("../services/auditLog.service");

// GET /api/audit-logs — activity timeline (manager only)
async function getAuditLogs(req, res) {
    try {
        const { entityType, entityId, limit } = req.query;
        const logs = await auditLogService.getAuditLogs({ entityType, entityId, limit });

        res.status(200).json({
            status: true,
            count: logs.length,
            logs,
        });
    } catch (error) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = { getAuditLogs };
