const Expense = require("../models/expense.model");
const Vehicle = require("../models/vehicle.model");
const Notification = require("../models/notification.model");
const { getSettings } = require("../services/settings.service");
const { recordAudit } = require("../services/auditLog.service");
const {
    NOTIFICATION_TYPES,
    NOTIFICATION_SEVERITY,
    APPROVAL_STATUS,
    AUDIT_ENTITY_TYPES,
} = require("../utils/constants");

function getApprovedExpenseMatch() {
    return {
        $or: [
            { approvalStatus: APPROVAL_STATUS.APPROVED },
            { approvalStatus: { $exists: false } },
        ],
    };
}

// POST /api/expenses — Create a new expense
async function createExpense(req, res) {
    try {
        const { vehicle, trip, type, amount, liters, date, notes } = req.body;

        const vehicleDoc = await Vehicle.findById(vehicle);
        if (!vehicleDoc) {
            return res.status(404).json({ message: "Vehicle not found", status: false });
        }

        const settings = await getSettings();
        const requiresApproval = amount >= settings.highExpenseApprovalThreshold;
        const approvalStatus = requiresApproval
            ? APPROVAL_STATUS.PENDING
            : APPROVAL_STATUS.APPROVED;

        const expense = new Expense({
            vehicle,
            trip: trip || null,
            type,
            amount,
            liters: type === "fuel" ? liters : null,
            date,
            notes,
            requiresApproval,
            approvalStatus,
            approvedBy: requiresApproval ? null : req.user._id,
            approvedAt: requiresApproval ? null : new Date(),
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

        await recordAudit({
            entityType: AUDIT_ENTITY_TYPES.EXPENSE,
            entityId: expense._id,
            action: "expense.created",
            description: `${type} expense of ${amount} ${settings.currency} created for ${vehicleDoc.name}`,
            performedBy: req.user._id,
            metadata: {
                amount,
                type,
                approvalStatus,
                vehicleId: vehicleDoc._id,
                vehicleName: vehicleDoc.name,
            },
        });

        const populated = await Expense.findById(expense._id)
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email");

        const message = requiresApproval
            ? `Expense created and pending manager approval (amount exceeds ${settings.highExpenseApprovalThreshold} ${settings.currency})`
            : "Expense created and auto-approved";

        res.status(201).json({
            message,
            status: true,
            expense: populated,
            requiresApproval,
            approvalStatus,
            approvalThreshold: settings.highExpenseApprovalThreshold,
        });
    } catch (error) {
        console.error("Create expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/expenses — Get all expenses with pagination and filters
async function getAllExpenses(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            vehicle,
            approvalStatus,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const filter = {};

        if (type) filter.type = type;
        if (vehicle) filter.vehicle = vehicle;
        if (approvalStatus) filter.approvalStatus = approvalStatus;

        const total = await Expense.countDocuments(filter);
        const expenses = await Expense.find(filter)
            .populate("vehicle", "name licensePlate type")
            .populate("trip", "origin destination")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email")
            .sort({ [sortBy]: order === "asc" ? 1 : -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

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
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/expenses/pending — Pending approval expenses
async function getPendingExpenses(req, res) {
    try {
        const expenses = await Expense.find({ approvalStatus: APPROVAL_STATUS.PENDING })
            .sort({ createdAt: -1 })
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email");

        res.status(200).json({
            status: true,
            count: expenses.length,
            expenses,
        });
    } catch (error) {
        console.error("Get pending expenses error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/expenses/vehicle/:vehicleId
async function getExpensesByVehicle(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            sortBy = "date",
            order = "desc",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
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
                .populate("createdBy", "name email")
                .populate("approvedBy", "name email"),
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
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// GET /api/expenses/vehicle/:vehicleId/total
async function getTotalCostPerVehicle(req, res) {
    try {
        const vehicleId = req.params.vehicleId;
        const vehicle = await Vehicle.findById(vehicleId).select("name licensePlate type");
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found", status: false });
        }

        const aggregation = await Expense.aggregate([
            { $match: { vehicle: vehicle._id, ...getApprovedExpenseMatch() } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    totalLiters: { $sum: { $ifNull: ["$liters", 0] } },
                    count: { $sum: 1 },
                },
            },
        ]);

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
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        if (expense.approvalStatus === APPROVAL_STATUS.PENDING) {
            return res.status(400).json({
                message: "Pending expenses cannot be edited until approved or rejected",
                status: false,
            });
        }

        const allowedFields = ["type", "amount", "liters", "date", "notes"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.type && updates.type !== "fuel") {
            updates.liters = null;
        }

        const updated = await Expense.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email");

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

// PATCH /api/expenses/:id/approve
async function approveExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id).populate("vehicle", "name licensePlate");
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        if (expense.approvalStatus !== APPROVAL_STATUS.PENDING) {
            return res.status(400).json({
                message: "Only pending expenses can be approved",
                status: false,
            });
        }

        expense.approvalStatus = APPROVAL_STATUS.APPROVED;
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
        expense.rejectionReason = null;
        await expense.save();

        await Notification.deleteOne({ dedupeKey: `expense_approval:${expense._id}` });

        await recordAudit({
            entityType: AUDIT_ENTITY_TYPES.EXPENSE,
            entityId: expense._id,
            action: "expense.approved",
            description: `${expense.type} expense of ${expense.amount} approved for ${expense.vehicle?.name || "vehicle"}`,
            performedBy: req.user._id,
            metadata: {
                amount: expense.amount,
                type: expense.type,
                vehicleId: expense.vehicle?._id,
            },
        });

        const populated = await Expense.findById(expense._id)
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email");

        res.status(200).json({
            message: "Expense approved successfully",
            status: true,
            expense: populated,
        });
    } catch (error) {
        console.error("Approve expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// PATCH /api/expenses/:id/reject
async function rejectExpense(req, res) {
    try {
        const { reason } = req.body;
        const expense = await Expense.findById(req.params.id).populate("vehicle", "name licensePlate");
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        if (expense.approvalStatus !== APPROVAL_STATUS.PENDING) {
            return res.status(400).json({
                message: "Only pending expenses can be rejected",
                status: false,
            });
        }

        expense.approvalStatus = APPROVAL_STATUS.REJECTED;
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
        expense.rejectionReason = reason || "Rejected by manager";
        await expense.save();

        await Notification.deleteOne({ dedupeKey: `expense_approval:${expense._id}` });

        await recordAudit({
            entityType: AUDIT_ENTITY_TYPES.EXPENSE,
            entityId: expense._id,
            action: "expense.rejected",
            description: `${expense.type} expense of ${expense.amount} rejected for ${expense.vehicle?.name || "vehicle"}`,
            performedBy: req.user._id,
            metadata: {
                amount: expense.amount,
                type: expense.type,
                reason: expense.rejectionReason,
            },
        });

        const populated = await Expense.findById(expense._id)
            .populate("vehicle", "name licensePlate type")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email");

        res.status(200).json({
            message: "Expense rejected",
            status: true,
            expense: populated,
        });
    } catch (error) {
        console.error("Reject expense error:", error);
        res.status(500).json({ message: "Internal server error", status: false });
    }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found", status: false });
        }

        await Expense.findByIdAndDelete(req.params.id);
        await Notification.deleteOne({ dedupeKey: `expense_approval:${expense._id}` });

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
    getPendingExpenses,
    getExpensesByVehicle,
    getTotalCostPerVehicle,
    updateExpense,
    approveExpense,
    rejectExpense,
    deleteExpense,
    getApprovedExpenseMatch,
};
