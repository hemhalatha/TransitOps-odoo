const Settings = require("../models/settings.model");

const DEFAULT_SETTINGS = {
    depotName: "Gandhinagar Depot GT4",
    currency: "INR",
    distanceUnit: "kilometers",
    licenseExpiryWarningDays: 30,
    minimumDriverSafetyScore: 70,
    fleetUtilizationWarningThreshold: 60,
    maintenanceReminderIntervalDays: 90,
    highExpenseApprovalThreshold: 10000,
};

let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

async function getSettings(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedSettings;
    }

    const settings = await Settings.findOneAndUpdate(
        { key: "default" },
        { $setOnInsert: DEFAULT_SETTINGS },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    cachedSettings = settings;
    cacheTimestamp = now;
    return settings;
}

function clearSettingsCache() {
    cachedSettings = null;
    cacheTimestamp = 0;
}

module.exports = {
    DEFAULT_SETTINGS,
    getSettings,
    clearSettingsCache,
};
