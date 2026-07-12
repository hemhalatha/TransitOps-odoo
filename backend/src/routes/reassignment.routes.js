const express = require("express");
const router = express.Router();
const reassignmentController = require("../controllers/reassignment.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

router.get(
    "/suggestions",
    authMiddleware,
    authorize("manager", "dispatcher"),
    reassignmentController.getSuggestions
);

module.exports = router;
