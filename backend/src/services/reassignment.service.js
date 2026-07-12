const Driver = require("../models/driver.model");
const Vehicle = require("../models/vehicle.model");
const Trip = require("../models/trip.model");
const { getSettings } = require("./settings.service");
const { VEHICLE_STATUS, DRIVER_STATUS } = require("../utils/constants");

async function getReassignmentSuggestions({
    cargoWeight = 0,
    excludeDriverId = null,
    excludeVehicleId = null,
    tripId = null,
} = {}) {
    const settings = await getSettings();
    const now = new Date();
    let resolvedCargoWeight = Number(cargoWeight) || 0;

    if (tripId) {
        const trip = await Trip.findById(tripId).select("cargoWeight origin destination vehicle driver");
        if (trip) {
            resolvedCargoWeight = trip.cargoWeight || resolvedCargoWeight;
            if (!excludeDriverId) excludeDriverId = trip.driver;
            if (!excludeVehicleId) excludeVehicleId = trip.vehicle;
        }
    }

    const driverFilter = {
        status: DRIVER_STATUS.ON_DUTY,
        licenseExpiry: { $gt: now },
        safetyScore: { $gte: settings.minimumDriverSafetyScore },
    };
    if (excludeDriverId) {
        driverFilter._id = { $ne: excludeDriverId };
    }

    const vehicleFilter = {
        status: VEHICLE_STATUS.AVAILABLE,
        maxCapacity: { $gte: resolvedCargoWeight },
    };
    if (excludeVehicleId) {
        vehicleFilter._id = { $ne: excludeVehicleId };
    }

    const [rankedDrivers, rankedVehicles] = await Promise.all([
        Driver.find(driverFilter)
            .select("name phone licenseNumber safetyScore totalTrips completedTrips status updatedAt")
            .sort({ safetyScore: -1, totalTrips: 1, updatedAt: 1 })
            .limit(5)
            .lean(),
        Vehicle.find(vehicleFilter)
            .select("name licensePlate type maxCapacity status updatedAt")
            .sort({ updatedAt: 1 })
            .limit(5)
            .lean(),
    ]);

    return {
        cargoWeight: resolvedCargoWeight,
        suggestedDriver: rankedDrivers[0] || null,
        suggestedVehicle: rankedVehicles[0] || null,
        rankedDrivers,
        rankedVehicles,
        rankingCriteria: {
            driver: ["available", "valid license", "highest safety score", "least recently used"],
            vehicle: ["available", "enough cargo capacity", "longest idle"],
        },
    };
}

module.exports = {
    getReassignmentSuggestions,
};
