const { body } = require("express-validator");

const updateSettingsValidator = [
    body("depotName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Depot name cannot be empty")
        .isLength({ max: 100 })
        .withMessage("Depot name must be 100 characters or fewer"),
    body("currency")
        .optional()
        .isIn(["INR", "USD", "EUR"])
        .withMessage("Currency must be INR, USD, or EUR"),
    body("distanceUnit")
        .optional()
        .isIn(["kilometers", "miles"])
        .withMessage("Distance unit must be kilometers or miles"),
    body("licenseExpiryWarningDays")
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage("License expiry warning days must be between 1 and 365"),
    body("minimumDriverSafetyScore")
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage("Minimum driver safety score must be between 0 and 100"),
    body("fleetUtilizationWarningThreshold")
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage("Fleet utilization warning threshold must be between 0 and 100"),
    body("maintenanceReminderIntervalDays")
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage("Maintenance reminder interval must be between 1 and 365 days"),
    body("highExpenseApprovalThreshold")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("High expense approval threshold must be a non-negative number"),
];

module.exports = { updateSettingsValidator };
