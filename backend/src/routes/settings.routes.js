const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { updateSettingsValidator } = require("../validators/settings.validator");
const validate = require("../validators/validate");

router.get("/", authMiddleware, settingsController.getSettings);
router.put(
    "/",
    authMiddleware,
    authorize("manager"),
    updateSettingsValidator,
    validate,
    settingsController.updateSettings
);

module.exports = router;
