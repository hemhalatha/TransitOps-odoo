const mongoose = require("mongoose");
const { AUDIT_ENTITY_TYPES_ARRAY } = require("../utils/constants");

const auditLogSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: {
                values: AUDIT_ENTITY_TYPES_ARRAY,
                message: "{VALUE} is not a valid audit entity type",
            },
            required: true,
            index: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
