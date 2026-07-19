const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .execute("sp_GetAllAccounts");

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {

        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .execute("sp_GetAccountById");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "Account not found"
            });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch account"
        });
    }
});


/* CREATE NEW ACCOUNT */
router.post("/", async (req, res) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {

        const {
            account_name,
            industry,
            phone,
            fax,
            website,
            street,
            city,
            state_province,
            zip_postal_code,
            country_region,
            currency,
            annual_revenue,
            payment_terms,
            shipping_method,
            contact_method,
            description,
            primary_contact_id,
            status
        } = req.body;

        if (!account_name || !account_name.trim()) {
            return res.status(400).json({
                error: "account_name is required"
            });
        }

        const parsedContactId = primary_contact_id ? parseInt(primary_contact_id) : null;

        await transaction.begin();

        const createRequest = new sql.Request(transaction);

        const createResult = await createRequest
            .input("account_name", sql.NVarChar, account_name)
            .input("industry", sql.NVarChar, industry)
            .input("phone", sql.NVarChar, phone)
            .input("fax", sql.NVarChar, fax)
            .input("website", sql.NVarChar, website)
            .input("street", sql.NVarChar, street)
            .input("city", sql.NVarChar, city)
            .input("state_province", sql.NVarChar, state_province)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code)
            .input("country_region", sql.NVarChar, country_region)
            .input("currency", sql.NVarChar, currency)
            .input("annual_revenue", sql.Decimal(18, 2), annual_revenue || 0)
            .input("payment_terms", sql.NVarChar, payment_terms)
            .input("shipping_method", sql.NVarChar, shipping_method)
            .input("contact_method", sql.NVarChar, contact_method)
            .input("description", sql.NVarChar, description)
            .input("primary_contact_id", sql.Int, parsedContactId)
            .input("status", sql.Bit, status ?? 1)
            .execute("sp_CreateAccount");

        const newAccountId = createResult.recordset[0].account_id;

        // Sync: point the new primary contact's account_id back to this account
        if (parsedContactId) {
            const syncRequest = new sql.Request(transaction);

            await syncRequest
                .input("contact_id", sql.Int, parsedContactId)
                .input("account_id", sql.Int, newAccountId)
                .execute("sp_UpdateContactAccount");
        }

        await transaction.commit();

        res.status(201).json({
            message: "Account created successfully",
            account_id: newAccountId
        });

    } catch (err) {

        console.error(err);

        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        res.status(500).json({
            error: "Failed to create account"
        });
    }
});

router.put("/:id", async (req, res) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {

        const { id } = req.params;
        const accountId = parseInt(id);

        const {
            account_name,
            industry,
            phone,
            fax,
            website,
            street,
            city,
            state_province,
            zip_postal_code,
            country_region,
            currency,
            annual_revenue,
            payment_terms,
            shipping_method,
            contact_method,
            description,
            primary_contact_id,
            status
        } = req.body;

        if (!account_name || !account_name.trim()) {
            return res.status(400).json({
                error: "account_name is required"
            });
        }

        const parsedContactId = primary_contact_id ? parseInt(primary_contact_id) : null;

        await transaction.begin();

        // Find the existing primary contact before overwriting, so we can
        // clear its account_id if it's being replaced
        const lookupRequest = new sql.Request(transaction);

        const existingResult = await lookupRequest
            .input("id", sql.Int, accountId)
            .query("SELECT primary_contact_id FROM Accounts WHERE account_id = @id");

        const previousContactId = existingResult.recordset[0]?.primary_contact_id || null;

        const updateRequest = new sql.Request(transaction);

        await updateRequest
            .input("id", sql.Int, accountId)
            .input("account_name", sql.NVarChar, account_name)
            .input("industry", sql.NVarChar, industry)
            .input("phone", sql.NVarChar, phone)
            .input("fax", sql.NVarChar, fax)
            .input("website", sql.NVarChar, website)
            .input("street", sql.NVarChar, street)
            .input("city", sql.NVarChar, city)
            .input("state_province", sql.NVarChar, state_province)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code)
            .input("country_region", sql.NVarChar, country_region)
            .input("currency", sql.NVarChar, currency)
            .input("annual_revenue", sql.Decimal(18, 2), annual_revenue || 0)
            .input("payment_terms", sql.NVarChar, payment_terms)
            .input("shipping_method", sql.NVarChar, shipping_method)
            .input("contact_method", sql.NVarChar, contact_method)
            .input("description", sql.NVarChar, description)
            .input("primary_contact_id", sql.Int, parsedContactId)
            .input("status", sql.Bit, status ?? 1)
            .execute("sp_UpdateAccount");

        // If the primary contact changed, clear account_id on the old one
        if (previousContactId && previousContactId !== parsedContactId) {
            const clearRequest = new sql.Request(transaction);

            await clearRequest
                .input("contact_id", sql.Int, previousContactId)
                .execute("sp_ClearContactAccount");
        }

        // Point the new primary contact's account_id back to this account
        if (parsedContactId) {
            const syncRequest = new sql.Request(transaction);

            await syncRequest
                .input("contact_id", sql.Int, parsedContactId)
                .input("account_id", sql.Int, accountId)
                .execute("sp_UpdateContactAccount");
        }

        await transaction.commit();

        res.status(200).json({ message: "Account updated successfully" });

    } catch (err) {

        console.error(err);

        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        res.status(500).json({
            error: "Failed to update account"
        });
    }
});


/* DELETE ACCOUNT (hard delete) */
router.delete("/:id", async (req, res) => {
    try {

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, req.params.id)
            .execute("sp_DeleteAccount");

        res.json({
            message: "Account deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

router.get("/:id/customer360", async (req, res) => {
    try {

        const accountId = parseInt(req.params.id);

        const pool = await poolPromise;

        const result = await pool.request()
            .input("accountId", sql.Int, accountId)
            .execute("sp_GetCustomer360");

        const account = result.recordsets[0][0] || null;

        const primaryContact =
            result.recordsets[1][0] || null;

        const contacts =
            result.recordsets[2] || [];

        const opportunities =
            result.recordsets[3] || [];

        const quotes =
            result.recordsets[4] || [];

        const orders =
            result.recordsets[5] || [];

        const invoices =
            result.recordsets[6] || [];

        const revenue =
            result.recordsets[7][0] || { revenue: 0 };

        const lastActivity =
            result.recordsets[8][0]?.last_activity || null;

        res.json({
            account,

            primary_contact: primaryContact,

            summary: {
                contacts: contacts.length,
                opportunities: opportunities.length,
                quotes: quotes.length,
                orders: orders.length,
                invoices: invoices.length,
                revenue: revenue.revenue
            },

            last_activity: lastActivity,

            contacts,
            opportunities,
            quotes,
            orders,
            invoices,
            revenue
        });

    } catch (error) {

        console.error("Customer360 Error:", error);

        res.status(500).json({
            message: "Failed to load customer 360 data"
        });

    }
});

module.exports = router;