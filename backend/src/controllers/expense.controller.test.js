const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Expense = require("../models/expense.model");
const { getAllExpenses } = require("./expense.controller");

function createQuery(result, captured) {
    return {
        sort(sortObj) {
            captured.sortObj = sortObj;
            return this;
        },
        skip(skipCount) {
            captured.skip = skipCount;
            return this;
        },
        limit(limitCount) {
            captured.limit = limitCount;
            return this;
        },
        populate() {
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        },
    };
}

test("getAllExpenses returns the pagination shape expected by the expenses page", async () => {
    const originalFind = Expense.find;
    const originalCountDocuments = Expense.countDocuments;
    const vehicleId = new mongoose.Types.ObjectId().toString();
    const captured = {};
    const expenses = [{ _id: new mongoose.Types.ObjectId(), type: "fuel", amount: 1200 }];

    Expense.find = (filter) => {
        captured.findFilter = filter;
        return createQuery(expenses, captured);
    };
    Expense.countDocuments = async (filter) => {
        captured.countFilter = filter;
        return 21;
    };

    const req = {
        query: {
            page: "2",
            limit: "10",
            type: "fuel",
            vehicle: vehicleId,
            sortBy: "amount",
            order: "asc",
        },
    };
    const res = {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
        },
    };

    try {
        await getAllExpenses(req, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(captured.findFilter, { type: "fuel", vehicle: vehicleId });
        assert.deepEqual(captured.countFilter, { type: "fuel", vehicle: vehicleId });
        assert.deepEqual(captured.sortObj, { amount: 1 });
        assert.equal(captured.skip, 10);
        assert.equal(captured.limit, 10);
        assert.equal(res.payload.total, 21);
        assert.equal(res.payload.totalPages, 3);
        assert.equal(res.payload.currentPage, 2);
        assert.equal(res.payload.count, 1);
        assert.equal(res.payload.expenses, expenses);
        assert.equal(Object.hasOwn(res.payload, "pagination"), false);
    } finally {
        Expense.find = originalFind;
        Expense.countDocuments = originalCountDocuments;
    }
});