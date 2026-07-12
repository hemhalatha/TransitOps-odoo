const Settings = require("../models/settings.model");
const {
    DEFAULT_SETTINGS,
    clearSettingsCache,
} = require("../services/settings.service");

const UPDATABLE_FIELDS = [
    "depotName",
    "currency",
    "distanceUnit",
    "licenseExpiryWarningDays",
    "minimumDriverSafetyScore",
    "fleetUtilizationWarningThreshold",
    "maintenanceReminderIntervalDays",
    "highExpenseApprovalThreshold",
];

// GET /api/settings — get the shared organization settings (all roles, read-only)
async function getSettings(req, res) {
    try {
        const settings = await Settings.findOneAndUpdate(
            { key: "default" },
            { $setOnInsert: DEFAULT_SETTINGS },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).populate("updatedBy", "name email");

        res.status(200).json({ status: true, settings });
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PUT /api/settings — update the shared organization settings (manager only)
async function updateSettings(req, res) {
    try {
        const updates = {};
        UPDATABLE_FIELDS.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        updates.updatedBy = req.user._id;

        const settings = await Settings.findOneAndUpdate(
            { key: "default" },
            { $set: updates, $setOnInsert: DEFAULT_SETTINGS },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).populate("updatedBy", "name email");

        clearSettingsCache();

        res.status(200).json({
            message: "Settings updated successfully",
            status: true,
            settings,
        });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = { getSettings, updateSettings };
