const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

console.log("QUOTES ROUTE LOADED");

const parseId = (val) => {
    const n = Number.parseInt(val, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const toNull = (v) => (v === undefined || v === "" ? null : v);

/* =========================================
   GET ALL QUOTES
========================================= */
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute("sp_GetAllQuotes");
        res.json(result.recordset);
    } catch (err) {
        console.error("GET QUOTES ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================================
   GET QUOTE BY ID + PRODUCTS
========================================= */
router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Invalid quote ID" });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("QuoteId", sql.Int, id)
            .execute("sp_GetQuoteById");

        const quote = result.recordsets?.[0]?.[0];
        if (!quote) {
            return res.status(404).json({ message: "Quote not found" });
        }

        quote.products = result.recordsets?.[1] || [];
        res.json(quote);
    } catch (err) {
        console.error("GET QUOTE BY ID ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================================
   CREATE QUOTE
========================================= */
router.post("/", async (req, res) => {
    try {

        const pool = await poolPromise;

        const quoteResult = await pool.request()
            .input("opportunity_id", sql.Int, req.body.opportunity_id)
            .input("account_id", sql.Int, req.body.account_id)
            .input("topic", sql.NVarChar(255), toNull(req.body.topic))
            .input("currency", sql.NVarChar(50), toNull(req.body.currency))
            .input("payment_terms", sql.NVarChar(255), toNull(req.body.payment_terms))
            .input("shipping_method", sql.NVarChar(255), toNull(req.body.shipping_method))
            .input("status", sql.NVarChar(50), toNull(req.body.status) || "Draft")
            .input("bill_to_street_1", sql.NVarChar(255), toNull(req.body.bill_to_street_1))
            .input("bill_to_street_2", sql.NVarChar(255), toNull(req.body.bill_to_street_2))
            .input("bill_to_street_3", sql.NVarChar(255), toNull(req.body.bill_to_street_3))
            .input("bill_to_city", sql.NVarChar(100), toNull(req.body.bill_to_city))
            .input("bill_to_state", sql.NVarChar(100), toNull(req.body.bill_to_state))
            .input("bill_to_zip", sql.NVarChar(20), toNull(req.body.bill_to_zip))
            .input("bill_to_country", sql.NVarChar(100), toNull(req.body.bill_to_country))
            .input("ship_to_street_1", sql.NVarChar(255), toNull(req.body.ship_to_street_1))
            .input("ship_to_street_2", sql.NVarChar(255), toNull(req.body.ship_to_street_2))
            .input("ship_to_street_3", sql.NVarChar(255), toNull(req.body.ship_to_street_3))
            .input("ship_to_city", sql.NVarChar(100), toNull(req.body.ship_to_city))
            .input("ship_to_state", sql.NVarChar(100), toNull(req.body.ship_to_state))
            .input("ship_to_zip", sql.NVarChar(20), toNull(req.body.ship_to_zip))
            .input("ship_to_country", sql.NVarChar(100), toNull(req.body.ship_to_country))
            .execute("sp_CreateQuote");

        const quoteId = quoteResult.recordset?.[0]?.quote_id;
        if (!quoteId) {
            return res.status(500).json({ message: "Quote created but ID was not returned" });
        }

        if (Array.isArray(req.body.products) && req.body.products.length > 0) {
            for (const p of req.body.products) {
                await pool.request()
                    .input("quote_id", sql.Int, quoteId)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddQuoteProduct");
            }

            await pool.request()
                .input("quote_id", sql.Int, quoteId)
                .execute("sp_UpdateQuoteTotal");
        }

        res.status(201).json({
            message: "Quote created successfully",
            quote_id: quoteId
        });
    } catch (err) {
        console.error("CREATE QUOTE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================================
   UPDATE QUOTE
========================================= */
router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Invalid quote ID" });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, id)
            .input("topic", sql.NVarChar(255), toNull(req.body.topic))
            .input("currency", sql.NVarChar(50), toNull(req.body.currency))
            .input("payment_terms", sql.NVarChar(255), toNull(req.body.payment_terms))
            .input("shipping_method", sql.NVarChar(255), toNull(req.body.shipping_method))
            .input("status", sql.NVarChar(50), toNull(req.body.status))
            .input("bill_to_street_1", sql.NVarChar(255), toNull(req.body.bill_to_street_1))
            .input("bill_to_street_2", sql.NVarChar(255), toNull(req.body.bill_to_street_2))
            .input("bill_to_street_3", sql.NVarChar(255), toNull(req.body.bill_to_street_3))
            .input("bill_to_city", sql.NVarChar(100), toNull(req.body.bill_to_city))
            .input("bill_to_state", sql.NVarChar(100), toNull(req.body.bill_to_state))
            .input("bill_to_zip", sql.NVarChar(20), toNull(req.body.bill_to_zip))
            .input("bill_to_country", sql.NVarChar(100), toNull(req.body.bill_to_country))
            .input("ship_to_street_1", sql.NVarChar(255), toNull(req.body.ship_to_street_1))
            .input("ship_to_street_2", sql.NVarChar(255), toNull(req.body.ship_to_street_2))
            .input("ship_to_street_3", sql.NVarChar(255), toNull(req.body.ship_to_street_3))
            .input("ship_to_city", sql.NVarChar(100), toNull(req.body.ship_to_city))
            .input("ship_to_state", sql.NVarChar(100), toNull(req.body.ship_to_state))
            .input("ship_to_zip", sql.NVarChar(20), toNull(req.body.ship_to_zip))
            .input("ship_to_country", sql.NVarChar(100), toNull(req.body.ship_to_country))
            .execute("sp_UpdateQuote");

        await pool.request()
            .input("quote_id", sql.Int, id)
            .execute("sp_DeleteQuoteProducts");

        if (Array.isArray(req.body.products) && req.body.products.length > 0) {
            for (const p of req.body.products) {
                await pool.request()
                    .input("quote_id", sql.Int, id)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddQuoteProduct");
            }

            await pool.request()
                .input("quote_id", sql.Int, id)
                .execute("sp_UpdateQuoteTotal");
        } else {
            await pool.request()
                .input("quote_id", sql.Int, id)
                .execute("sp_UpdateQuoteTotal");
        }

        res.json({ message: "Quote updated successfully" });
    } catch (err) {
        console.error("UPDATE QUOTE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================================
   DELETE QUOTE
========================================= */
router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Invalid quote ID" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_DeleteQuote");

        res.json({ message: "Quote deleted successfully" });
    } catch (err) {
        console.error("DELETE QUOTE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;