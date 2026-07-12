const reassignmentService = require("../services/reassignment.service");

// GET /api/reassignment/suggestions — ranked replacement driver and vehicle
async function getSuggestions(req, res) {
    try {
        const { cargoWeight, tripId, excludeDriverId, excludeVehicleId } = req.query;
        const suggestions = await reassignmentService.getReassignmentSuggestions({
            cargoWeight,
            tripId,
            excludeDriverId,
            excludeVehicleId,
        });

        res.status(200).json({
            status: true,
            suggestions,
        });
    } catch (error) {
        console.error("Reassignment suggestions error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = { getSuggestions };
