const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

const addCommonParams = (request, query) => {
    if (query.from_date) request.input("from_date", sql.Date, query.from_date);
    if (query.to_date) request.input("to_date", sql.Date, query.to_date);
    if (query.account_id) request.input("account_id", sql.Int, Number(query.account_id));
    return request;
};

router.get("/overview", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = addCommonParams(pool.request(), req.query);
        const result = await request.execute("sp_DashboardOverview");
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("overview error:", err);
        res.status(500).json({ message: "Dashboard error" });
    }
});

router.get("/lead-status", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        if (req.query.from_date) request.input("from_date", sql.Date, req.query.from_date);
        if (req.query.to_date) request.input("to_date", sql.Date, req.query.to_date);

        const result = await request.execute("sp_DashboardLeadStatus");
        res.json(result.recordset);
    } catch (err) {
        console.error("lead-status error:", err);
        res.status(500).json({ message: "Error fetching lead status" });
    }
});

router.get("/opportunity-status", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        if (req.query.from_date) request.input("from_date", sql.Date, req.query.from_date);
        if (req.query.to_date) request.input("to_date", sql.Date, req.query.to_date);
        if (req.query.account_id) request.input("account_id", sql.Int, Number(req.query.account_id));

        const result = await request.execute("sp_DashboardOpportunityStatus");
        res.json(result.recordset);
    } catch (err) {
        console.error("opportunity-status error:", err);
        res.status(500).json({ message: "Error fetching opportunity status" });
    }
});

router.get("/sales-conversion", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = addCommonParams(pool.request(), req.query);
        const result = await request.execute("sp_DashboardSalesConversion");
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("sales-conversion error:", err);
        res.status(500).json({ message: "Error fetching conversion data" });
    }
});

router.get("/sales-by-account", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = addCommonParams(pool.request(), req.query);
        const result = await request.execute("sp_DashboardSalesByAccount");
        res.json(result.recordset);
    } catch (err) {
        console.error("sales-by-account error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get("/sales-by-product", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = addCommonParams(pool.request(), req.query);
        const result = await request.execute("sp_DashboardSalesByProduct");
        res.json(result.recordset);
    } catch (err) {
        console.error("sales-by-product error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get("/recent-opportunities", async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = addCommonParams(pool.request(), req.query);
        const result = await request.execute("sp_DashboardRecentOpportunities");
        res.json(result.recordset);
    } catch (err) {
        console.error("recent-opportunities error:", err);
        res.status(500).json({ message: "Error fetching recent opportunities" });
    }
});

module.exports = router;