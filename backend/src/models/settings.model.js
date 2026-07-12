const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: "default",
            unique: true,
            immutable: true,
        },
        depotName: {
            type: String,
            required: true,
            trim: true,
            default: "Gandhinagar Depot GT4",
        },
        currency: {
            type: String,
            enum: ["INR", "USD", "EUR"],
            default: "INR",
        },
        distanceUnit: {
            type: String,
            enum: ["kilometers", "miles"],
            default: "kilometers",
        },
        licenseExpiryWarningDays: {
            type: Number,
            default: 30,
            min: [1, "License expiry warning must be at least 1 day"],
            max: [365, "License expiry warning cannot exceed 365 days"],
        },
        minimumDriverSafetyScore: {
            type: Number,
            default: 70,
            min: [0, "Minimum safety score cannot be negative"],
            max: [100, "Minimum safety score cannot exceed 100"],
        },
        fleetUtilizationWarningThreshold: {
            type: Number,
            default: 60,
            min: [0, "Utilization threshold cannot be negative"],
            max: [100, "Utilization threshold cannot exceed 100"],
        },
        maintenanceReminderIntervalDays: {
            type: Number,
            default: 90,
            min: [1, "Maintenance reminder interval must be at least 1 day"],
            max: [365, "Maintenance reminder interval cannot exceed 365 days"],
        },
        highExpenseApprovalThreshold: {
            type: Number,
            default: 10000,
            min: [0, "Expense approval threshold cannot be negative"],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
