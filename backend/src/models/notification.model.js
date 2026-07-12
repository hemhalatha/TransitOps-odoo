const mongoose = require("mongoose");
const {
    NOTIFICATION_TYPES_ARRAY,
    NOTIFICATION_SEVERITY_ARRAY,
    USER_ROLES_ARRAY,
} = require("../utils/constants");

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: {
                values: NOTIFICATION_TYPES_ARRAY,
                message: "{VALUE} is not a valid notification type",
            },
            required: true,
        },
        severity: {
            type: String,
            enum: {
                values: NOTIFICATION_SEVERITY_ARRAY,
                message: "{VALUE} is not a valid severity level",
            },
            default: "warning",
        },
        targetRoles: {
            type: [String],
            enum: USER_ROLES_ARRAY,
            default: [],
        },
        entityType: {
            type: String,
            enum: ["driver", "vehicle", "fleet", "expense"],
            default: null,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        dedupeKey: {
            type: String,
            required: true,
            unique: true,
        },
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ "readBy.user": 1 });

module.exports = mongoose.model("Notification", notificationSchema);
