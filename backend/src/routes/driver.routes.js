const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createDriverValidator, updateDriverValidator } = require("../validators/driver.validator");
const validate = require("../validators/validate");

const allRoles = ["manager", "dispatcher", "safety_officer", "financial_analyst"];

// GET /api/drivers — list all drivers
router.get(
    "/",
    authMiddleware,
    authorize(...allRoles),
    driverController.getDrivers
);

// POST /api/drivers — manager only
router.post(
    "/",
    authMiddleware,
    authorize("manager"),
    createDriverValidator,
    validate,
    driverController.createDriver
);

// GET /api/drivers/:id/performance — driver performance profile
router.get(
    "/:id/performance",
    authMiddleware,
    authorize(...allRoles),
    driverController.getDriverPerformance
);

// GET /api/drivers/:id — single driver
router.get(
    "/:id",
    authMiddleware,
    authorize(...allRoles),
    driverController.getDriverById
);

// PUT /api/drivers/:id — manager only
router.put(
    "/:id",
    authMiddleware,
    authorize("manager"),
    updateDriverValidator,
    validate,
    driverController.updateDriver
);

// DELETE /api/drivers/:id — manager only
router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    driverController.deleteDriver
);

module.exports = router;
