const Expense = require("../models/expense.model");
const Vehicle = require("../models/vehicle.model");
const Notification = require("../models/notification.model");
const { getSettings } = require("../services/settings.service");
const { NOTIFICATION_TYPES, NOTIFICATION_SEVERITY } = require("../utils/constants");

// POST /api/expenses — Create a new expense
async function createExpense(req, res) {
    try {
        const { vehicle, trip, type, amount, liters, date, notes } = req.body;

        // Verify vehicle exists
        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        const settings = await getSettings();
        const requiresApproval = amount >= settings.highExpenseApprovalThreshold;

        const expense = new Expense({
            vehicle,
            trip: trip || null,
            type,
            amount,
            liters: type === "fuel" ? liters : null,
            date,
            notes,
            requiresApproval,
            createdBy: req.user._id,
        });

        await expense.save();

        if (requiresApproval) {
            await Notification.findOneAndUpdate(
                { dedupeKey: `expense_approval:${expense._id}` },
                {
                    $set: {
                        title: "High Expense Requires Approval",
                        message: `A ${type} expense of ${amount} ${settings.currency} for ${vehicleDoc.name} exceeds the approval threshold of ${settings.highExpenseApprovalThreshold} ${settings.currency}.`,
                        type: NOTIFICATION_TYPES.EXPENSE_APPROVAL,
                        severity: NOTIFICATION_SEVERITY.WARNING,
                        targetRoles: ["manager", "financial_analyst"],
                        entityType: "expense",
                        entityId: expense._id,
                    },
            $setOnInsert: {
                dedupeKey: `expense_approval:${expense._id}`,
            },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        const populated = await Expense.findById(expense._id)
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email");

        const message = requiresApproval
            ? `Expense created and flagged for manager approval (amount exceeds ${settings.highExpenseApprovalThreshold} ${settings.currency})`
            : "Expense created successfully";

        res.status(201).json({
            message,
            status: true,
            expense: populated,
            requiresApproval,
            approvalThreshold: settings.highExpenseApprovalThreshold,
        });
    } catch (error) {
        console.error("Create expense error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses — Get all expenses with pagination, filters, search
async function getAllExpenses(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            vehicle,
            search,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = {};
        if (type) filter.type = type;
        if (vehicle) filter.vehicle = vehicle;

        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type")
                .populate("trip", "origin destination")
                .populate("createdBy", "name email"),
            Expense.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: expenses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            expenses,
        });
    } catch (error) {
        console.error("Get all expenses error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses/vehicle/:vehicleId — Get all expenses for a vehicle
async function getExpensesByVehicle(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

        const filter = { vehicle: req.params.vehicleId };
        if (type) filter.type = type;

        const sortObj = {};
        sortObj[sortBy] = order === "asc" ? 1 : -1;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate("vehicle", "name licensePlate type")
                .populate("createdBy", "name email"),
            Expense.countDocuments(filter),
        ]);

        res.status(200).json({
            status: true,
            count: expenses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            expenses,
        });
    } catch (error) {
        console.error("Get expenses by vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// GET /api/expenses/vehicle/:vehicleId/total — Aggregated cost breakdown per vehicle
async function getTotalCostPerVehicle(req, res) {
    try {
        const vehicleId = req.params.vehicleId;

        // Verify vehicle exists
        const vehicle = await Vehicle.findById(vehicleId).select("name licensePlate type");
        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
                status: false,
            });
        }

        const aggregation = await Expense.aggregate([
            { $match: { vehicle: vehicle._id } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    totalLiters: { $sum: { $ifNull: ["$liters", 0] } },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Build a clean breakdown object
        const breakdown = {};
        let grandTotal = 0;

        aggregation.forEach((item) => {
            breakdown[item._id] = {
                totalAmount: item.totalAmount,
                totalLiters: item.totalLiters,
                count: item.count,
            };
            grandTotal += item.totalAmount;
        });

        res.status(200).json({
            status: true,
            vehicle: {
                _id: vehicle._id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
            },
            grandTotal,
            breakdown,
        });
    } catch (error) {
        console.error("Get total cost per vehicle error:", error);
        res.status(500).json({
            message: "Internal server error",
            status: false,
        });
    }
}

// PUT /api/expenses/:id — Update an expense
async function updateExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        const allowedFields = ["type", "amount", "liters", "date", "notes"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // If type is changed away from fuel, clear liters
        if (updates.type && updates.type !== "fuel") {
            updates.liters = null;
        }

        const updated = await Expense.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email");

        res.status(200).json({
            message: "Expense updated successfully",
            status: true,
            expense: updated,
        });
    } catch (error) {
        console.error("Update expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// DELETE /api/expenses/:id — Delete an expense
async function deleteExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        await Expense.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Expense deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Delete expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

module.exports = {
    createExpense,
    getAllExpenses,
    getExpensesByVehicle,
    getTotalCostPerVehicle,
    updateExpense,
    deleteExpense,
};
