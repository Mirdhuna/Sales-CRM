
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

/* GET ALL LEADS */
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`

          SELECT 
    l.lead_id,
    l.topic,
    l.account_id,
    a.account_name,
    l.primary_contact_id,
    CONCAT(c.first_name,' ',c.last_name) AS primary_contact,
    l.rating,
    l.currency,
    l.estimated_budget,
    l.status,
    l.purchase_timeframe,
    l.created_at
FROM leads l
LEFT JOIN accounts a ON l.account_id = a.account_id
LEFT JOIN contacts c ON l.primary_contact_id = c.contact_id
ORDER BY l.lead_id DESC;

        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch leads"
        });
    }
});

/* GET LEAD BY ID */
router.get("/:id", async (req, res) => {
    try {

        console.log(req.params.id);
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT
                    l.*,
                    a.account_name,
                    CONCAT(c.first_name,' ',c.last_name) AS primary_contact
                FROM Leads l
                LEFT JOIN Accounts a
                    ON l.account_id = a.account_id
                LEFT JOIN Contacts c
                    ON l.primary_contact_id = c.contact_id
                WHERE l.lead_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch lead"
        });
    }
});

/* CREATE LEAD */
router.post("/", async (req, res) => {
    try {
        const {
            account_id,
            primary_contact_id,
            topic,
            description,
            currency,
            payment_terms,
            shipping_method,
            contact_method,
            rating,
            order_type,
            purchase_timeframe,
            estimated_budget,
            purchase_process,
            capture_summary,
            status
        } = req.body;

        // ================= BASIC VALIDATION =================
        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const pool = await poolPromise;

        await pool.request()

            .input("account_id", sql.Int, account_id ? Number(account_id) : null)
            .input("primary_contact_id", sql.Int, primary_contact_id ? Number(primary_contact_id) : null)
            .input("topic", sql.NVarChar, topic)
            .input("description", sql.NVarChar, description || null)
            .input("currency", sql.NVarChar, currency || "USD")
            .input("payment_terms", sql.NVarChar, payment_terms || null)
            .input("shipping_method", sql.NVarChar, shipping_method || null)
            .input("contact_method", sql.NVarChar, contact_method || null)
            .input("rating", sql.NVarChar, rating || null)
            .input("order_type", sql.NVarChar, order_type || null)
            .input("purchase_timeframe", sql.NVarChar, purchase_timeframe || null)

            // 🔥 SAFE NUMBER CONVERSION (IMPORTANT FIX)
            .input(
                "estimated_budget",
                sql.Decimal(18, 2),
                estimated_budget && !isNaN(estimated_budget)
                    ? parseFloat(estimated_budget)
                    : 0
            )

            .input("purchase_process", sql.NVarChar, purchase_process || null)
            .input("capture_summary", sql.NVarChar, capture_summary || null)
            .input("status", sql.NVarChar, status || "New")

            .query(`
                INSERT INTO Leads (
                    account_id,
                    primary_contact_id,
                    topic,
                    description,
                    currency,
                    payment_terms,
                    shipping_method,
                    contact_method,
                    rating,
                    order_type,
                    purchase_timeframe,
                    estimated_budget,
                    purchase_process,
                    capture_summary,
                    status
                )
                VALUES (
                    @account_id,
                    @primary_contact_id,
                    @topic,
                    @description,
                    @currency,
                    @payment_terms,
                    @shipping_method,
                    @contact_method,
                    @rating,
                    @order_type,
                    @purchase_timeframe,
                    @estimated_budget,
                    @purchase_process,
                    @capture_summary,
                    @status
                )
            `);

        res.status(201).json({
            message: "Lead created successfully"
        });

    } catch (err) {
        console.error("CREATE LEAD ERROR:", err);
        res.status(500).json({
            error: err.message
        });
    }
});



/* UPDATE LEAD */

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, id)

            .input("account_id", sql.Int, req.body.account_id || null)
            .input("primary_contact_id", sql.Int, req.body.primary_contact_id || null)

            .input("topic", sql.NVarChar, req.body.topic || null)
            .input("description", sql.NVarChar, req.body.description || null)
            .input("currency", sql.NVarChar, req.body.currency || "USD")

            // 🔥 FIXED: prevent CHECK constraint crash
            .input(
                "payment_terms",
                sql.NVarChar,
                req.body.payment_terms && req.body.payment_terms !== ""
                    ? req.body.payment_terms
                    : null
            )

            .input(
                "shipping_method",
                sql.NVarChar,
                req.body.shipping_method && req.body.shipping_method !== ""
                    ? req.body.shipping_method
                    : null
            )

            .input(
                "contact_method",
                sql.NVarChar,
                req.body.contact_method && req.body.contact_method !== ""
                    ? req.body.contact_method
                    : null
            )

            .input(
                "rating",
                sql.NVarChar,
                req.body.rating && req.body.rating !== ""
                    ? req.body.rating
                    : null
            )

            .input(
                "order_type",
                sql.NVarChar,
                req.body.order_type && req.body.order_type !== ""
                    ? req.body.order_type
                    : null
            )

            .input(
                "purchase_timeframe",
                sql.NVarChar,
                req.body.purchase_timeframe && req.body.purchase_timeframe !== ""
                    ? req.body.purchase_timeframe
                    : null
            )

            // 🔥 FIXED NUMBER SAFETY
            .input(
                "estimated_budget",
                sql.Decimal(18, 2),
                req.body.estimated_budget && !isNaN(req.body.estimated_budget)
                    ? parseFloat(req.body.estimated_budget)
                    : 0
            )

            .input("purchase_process", sql.NVarChar, req.body.purchase_process || null)
            .input("capture_summary", sql.NVarChar, req.body.capture_summary || null)
            .input("status", sql.NVarChar, req.body.status || "New")

            .query(`
                UPDATE Leads
                SET
                    account_id = @account_id,
                    primary_contact_id = @primary_contact_id,
                    topic = @topic,
                    description = @description,
                    currency = @currency,
                    payment_terms = @payment_terms,
                    shipping_method = @shipping_method,
                    contact_method = @contact_method,
                    rating = @rating,
                    order_type = @order_type,
                    purchase_timeframe = @purchase_timeframe,
                    estimated_budget = @estimated_budget,
                    purchase_process = @purchase_process,
                    capture_summary = @capture_summary,
                    status = @status
                WHERE lead_id = @id
            `);

        res.json({
            message: "Lead updated successfully"
        });

    } catch (err) {
        console.error("UPDATE LEAD ERROR:", err);
        res.status(500).json({
            error: err.message
        });
    }
});


/* DELETE LEAD */
router.delete("/:id", async (req, res) => {

    try {

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                DELETE FROM Leads
                WHERE lead_id = @id
            `);

        res.json({
            message: "Lead deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete lead"
        });
    }
});

module.exports = router;