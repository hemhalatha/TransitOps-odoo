const AuditLog = require("../models/auditLog.model");

async function recordAudit({
    entityType,
    entityId = null,
    action,
    description,
    performedBy,
    metadata = {},
}) {
    if (!performedBy) {
        return null;
    }

    return AuditLog.create({
        entityType,
        entityId,
        action,
        description,
        performedBy,
        metadata,
    });
}

async function getAuditLogs({ entityType, entityId, limit = 50 } = {}) {
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;

    const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    return AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .populate("performedBy", "name email role");
}

module.exports = {
    recordAudit,
    getAuditLogs,
};
