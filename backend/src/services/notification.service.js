const Notification = require("../models/notification.model");
const Driver = require("../models/driver.model");
const Vehicle = require("../models/vehicle.model");
const Maintenance = require("../models/maintenance.model");
const { getSettings } = require("./settings.service");
const {
    NOTIFICATION_TYPES,
    NOTIFICATION_SEVERITY,
    VEHICLE_STATUS,
    DRIVER_STATUS,
    MAINTENANCE_STATUS,
} = require("../utils/constants");

async function upsertNotification({
    title,
    message,
    type,
    severity = NOTIFICATION_SEVERITY.WARNING,
    targetRoles,
    entityType = null,
    entityId = null,
    dedupeKey,
}) {
    return Notification.findOneAndUpdate(
        { dedupeKey },
        {
            $set: {
                title,
                message,
                type,
                severity,
                targetRoles,
                entityType,
                entityId,
            },
            $setOnInsert: {
                dedupeKey,
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

async function generateLicenseExpiryNotifications(settings) {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + settings.licenseExpiryWarningDays);

    const drivers = await Driver.find({
        status: { $ne: DRIVER_STATUS.SUSPENDED },
        licenseExpiry: { $lte: warningDate },
    }).select("name licenseNumber licenseExpiry");

    for (const driver of drivers) {
        const isExpired = driver.licenseExpiry <= now;
        const daysRemaining = Math.ceil(
            (driver.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await upsertNotification({
            title: isExpired ? "Driver License Expired" : "Driver License Expiring Soon",
            message: isExpired
                ? `${driver.name} (${driver.licenseNumber}) has an expired license.`
                : `${driver.name} (${driver.licenseNumber}) license expires in ${daysRemaining} day(s).`,
            type: NOTIFICATION_TYPES.LICENSE_EXPIRY,
            severity: isExpired ? NOTIFICATION_SEVERITY.CRITICAL : NOTIFICATION_SEVERITY.WARNING,
            targetRoles: ["manager", "safety_officer", "dispatcher"],
            entityType: "driver",
            entityId: driver._id,
            dedupeKey: `license_expiry:${driver._id}`,
        });
    }
}

async function generateSafetyScoreNotifications(settings) {
    const drivers = await Driver.find({
        safetyScore: { $lt: settings.minimumDriverSafetyScore },
        status: { $ne: DRIVER_STATUS.SUSPENDED },
    }).select("name licenseNumber safetyScore");

    for (const driver of drivers) {
        await upsertNotification({
            title: "Low Driver Safety Score",
            message: `${driver.name} has a safety score of ${driver.safetyScore}, below the minimum of ${settings.minimumDriverSafetyScore}.`,
            type: NOTIFICATION_TYPES.SAFETY_SCORE,
            severity: NOTIFICATION_SEVERITY.WARNING,
            targetRoles: ["manager", "safety_officer"],
            entityType: "driver",
            entityId: driver._id,
            dedupeKey: `safety_score:${driver._id}`,
        });
    }
}

async function generateMaintenanceOverdueNotifications(settings) {
    const now = new Date();
    const intervalMs = settings.maintenanceReminderIntervalDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now.getTime() - intervalMs);

    const vehicles = await Vehicle.find({ status: { $ne: VEHICLE_STATUS.RETIRED } }).select(
        "name licensePlate"
    );

    for (const vehicle of vehicles) {
        const lastCompleted = await Maintenance.findOne({
            vehicle: vehicle._id,
            status: MAINTENANCE_STATUS.COMPLETED,
        })
            .sort({ completionDate: -1 })
            .select("completionDate serviceDate");

        const lastServiceDate = lastCompleted?.completionDate || lastCompleted?.serviceDate || null;
        const isOverdue = !lastServiceDate || lastServiceDate < cutoffDate;

        const overdueScheduled = await Maintenance.findOne({
            vehicle: vehicle._id,
            status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.IN_PROGRESS] },
            serviceDate: { $lt: now },
        });

        if (isOverdue || overdueScheduled) {
            const daysSinceService = lastServiceDate
                ? Math.floor((now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24))
                : null;

            await upsertNotification({
                title: "Maintenance Overdue",
                message: overdueScheduled
                    ? `${vehicle.name} (${vehicle.licensePlate}) has overdue scheduled maintenance.`
                    : lastServiceDate
                        ? `${vehicle.name} (${vehicle.licensePlate}) has not been serviced in ${daysSinceService} days (interval: ${settings.maintenanceReminderIntervalDays} days).`
                        : `${vehicle.name} (${vehicle.licensePlate}) has no completed maintenance on record.`,
                type: NOTIFICATION_TYPES.MAINTENANCE_OVERDUE,
                severity: NOTIFICATION_SEVERITY.WARNING,
                targetRoles: ["manager", "safety_officer"],
                entityType: "vehicle",
                entityId: vehicle._id,
                dedupeKey: `maintenance_overdue:${vehicle._id}`,
            });
        } else {
            await Notification.deleteOne({ dedupeKey: `maintenance_overdue:${vehicle._id}` });
        }
    }
}

async function generateFleetUtilizationNotifications(settings) {
    const [totalVehicles, onTripVehicles, retiredVehicles] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
        Vehicle.countDocuments({ status: VEHICLE_STATUS.RETIRED }),
    ]);

    const operationalVehicles = totalVehicles - retiredVehicles;
    const utilizationRate =
        operationalVehicles > 0
            ? parseFloat(((onTripVehicles / operationalVehicles) * 100).toFixed(2))
            : 0;

    if (utilizationRate < settings.fleetUtilizationWarningThreshold) {
        await upsertNotification({
            title: "Low Fleet Utilization",
            message: `Fleet utilization is ${utilizationRate}%, below the warning threshold of ${settings.fleetUtilizationWarningThreshold}%.`,
            type: NOTIFICATION_TYPES.FLEET_UTILIZATION,
            severity: NOTIFICATION_SEVERITY.INFO,
            targetRoles: ["manager", "financial_analyst"],
            entityType: "fleet",
            entityId: null,
            dedupeKey: "fleet_utilization:low",
        });
    } else {
        await Notification.deleteOne({ dedupeKey: "fleet_utilization:low" });
    }
}

async function runNotificationChecks() {
    const settings = await getSettings(true);
    await Promise.all([
        generateLicenseExpiryNotifications(settings),
        generateSafetyScoreNotifications(settings),
        generateMaintenanceOverdueNotifications(settings),
        generateFleetUtilizationNotifications(settings),
    ]);
}

function buildRoleFilter(userRole) {
    if (userRole === "manager") {
        return {};
    }
    return { targetRoles: userRole };
}

function isReadByUser(notification, userId) {
    return notification.readBy?.some((entry) => entry.user.toString() === userId.toString());
}

function withReadState(notifications, userId) {
    return notifications.map((notification) => {
        const plain = notification.toObject ? notification.toObject() : { ...notification };
        const readEntry = plain.readBy?.find((entry) => entry.user.toString() === userId.toString());
        return {
            ...plain,
            isRead: Boolean(readEntry),
            readAt: readEntry?.readAt || null,
        };
    });
}

async function getNotificationsForUser(user, { unreadOnly = false } = {}) {
    const filter = buildRoleFilter(user.role);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    const withState = withReadState(notifications, user._id);

    if (unreadOnly) {
        return withState.filter((notification) => !notification.isRead);
    }

    return withState;
}

async function getUnreadCountForUser(user) {
    const filter = buildRoleFilter(user.role);
    const notifications = await Notification.find(filter).select("readBy");
    return notifications.filter((notification) => !isReadByUser(notification, user._id)).length;
}

async function markNotificationRead(notificationId, user) {
    const filter = { _id: notificationId, ...buildRoleFilter(user.role) };
    const notification = await Notification.findOne(filter);

    if (!notification) {
        return null;
    }

    if (!isReadByUser(notification, user._id)) {
        notification.readBy.push({ user: user._id, readAt: new Date() });
        await notification.save();
    }

    const [withState] = withReadState([notification], user._id);
    return withState;
}

async function markAllNotificationsRead(user) {
    const filter = buildRoleFilter(user.role);
    const notifications = await Notification.find(filter);
    let modifiedCount = 0;

    for (const notification of notifications) {
        if (!isReadByUser(notification, user._id)) {
            notification.readBy.push({ user: user._id, readAt: new Date() });
            await notification.save();
            modifiedCount += 1;
        }
    }

    return modifiedCount;
}

module.exports = {
    runNotificationChecks,
    getNotificationsForUser,
    getUnreadCountForUser,
    markNotificationRead,
    markAllNotificationsRead,
};
