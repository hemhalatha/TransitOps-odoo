const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expense.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");
const { createExpenseValidator, updateExpenseValidator } = require("../validators/expense.validator");
const validate = require("../validators/validate");

const expenseRoles = ["manager", "financial_analyst", "dispatcher"];

router.get(
    "/pending",
    authMiddleware,
    authorize("manager", "financial_analyst"),
    expenseController.getPendingExpenses
);

router.get(
    "/",
    authMiddleware,
    authorize(...expenseRoles),
    expenseController.getAllExpenses
);

router.post(
    "/",
    authMiddleware,
    authorize(...expenseRoles),
    createExpenseValidator,
    validate,
    expenseController.createExpense
);

router.get(
    "/vehicle/:vehicleId/total",
    authMiddleware,
    authorize(...expenseRoles),
    expenseController.getTotalCostPerVehicle
);

router.get(
    "/vehicle/:vehicleId",
    authMiddleware,
    authorize(...expenseRoles),
    expenseController.getExpensesByVehicle
);

router.patch(
    "/:id/approve",
    authMiddleware,
    authorize("manager"),
    expenseController.approveExpense
);

router.patch(
    "/:id/reject",
    authMiddleware,
    authorize("manager"),
    expenseController.rejectExpense
);

router.put(
    "/:id",
    authMiddleware,
    authorize(...expenseRoles),
    updateExpenseValidator,
    validate,
    expenseController.updateExpense
);

router.delete(
    "/:id",
    authMiddleware,
    authorize("manager"),
    expenseController.deleteExpense
);

module.exports = router;
