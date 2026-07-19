const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../db");

console.log("OPPORTUNITIES ROUTE LOADED");

// =========================
// GET ALL OPPORTUNITIES
// =========================
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .execute("sp_GetAllOpportunities");

        res.json(result.recordset);

    } catch (err) {
        console.error("GET ALL ERROR:", err);
        res.status(500).json({ error: "Failed to fetch opportunities" });
    }
});

// =========================
// GET OPPORTUNITY BY ID
// =========================
router.get("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const result = await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_GetOpportunityById");

        if (result.recordsets[0].length === 0) {
            return res.status(404).json({ error: "Opportunity not found" });
        }

        const opportunity = result.recordsets[0][0];
        opportunity.products = result.recordsets[1] || [];

        res.json(opportunity);

    } catch (err) {
        console.error("GET BY ID ERROR:", err);
        res.status(500).json({ error: "Failed to fetch opportunity" });
    }
});

// =========================
// CREATE OPPORTUNITY
// =========================
router.post("/", async (req, res) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {

        const {
            topic,
            account_id,
            primary_contact_id,
            budget_amount,
            purchase_timeframe,
            purchase_process,
            currency,
            description,
            customer_need,
            proposed_solution,
            status,
            products
        } = req.body;

        if (!account_id || !primary_contact_id) {
            return res.status(400).json({
                error: "account_id and primary_contact_id are required"
            });
        }

        await transaction.begin();

        const createRequest = new sql.Request(transaction);

        const createResult = await createRequest
            .input("topic", sql.NVarChar, topic || null)
            .input("account_id", sql.Int, Number(account_id))
            .input("primary_contact_id", sql.Int, Number(primary_contact_id))
            .input("budget_amount", sql.Decimal(18, 2), Number(budget_amount) || 0)
            .input("purchase_timeframe", sql.NVarChar, purchase_timeframe || "Unknown")
            .input("purchase_process", sql.NVarChar, purchase_process || "Unknown")
            .input("currency", sql.NVarChar, currency || "USD")
            .input("description", sql.NVarChar, description || null)
            .input("customer_need", sql.NVarChar, customer_need || null)
            .input("proposed_solution", sql.NVarChar, proposed_solution || null)
            .input("status", sql.NVarChar, status || "New")
            .execute("sp_CreateOpportunity");

        const opportunityId = createResult.recordset[0].opportunity_id;

        if (products?.length) {
            for (const p of products) {
                const productRequest = new sql.Request(transaction);

                await productRequest
                    .input("opportunity_id", sql.Int, opportunityId)
                    .input("product_id", sql.Int, p.product_id)
                    .input("quantity", sql.Decimal(18, 2), p.quantity || 0)
                    .input("price_per_unit", sql.Decimal(18, 2), p.price_per_unit || 0)
                    .input("manual_discount", sql.Decimal(18, 2), p.manual_discount || 0)
                    .input("tax_amount", sql.Decimal(18, 2), p.tax_amount || 0)
                    .execute("sp_AddOpportunityProduct");
            }
        }

        await transaction.commit();

        res.status(201).json({
            message: "Opportunity created successfully",
            opportunity_id: opportunityId
        });

    } catch (err) {

        console.error("CREATE ERROR:", err);

        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        res.status(500).json({ error: "Failed to create opportunity" });
    }
});

// =========================
// UPDATE OPPORTUNITY
// =========================
router.put("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const {
            topic,
            account_id,
            primary_contact_id,
            budget_amount,
            purchase_timeframe,
            purchase_process,
            currency,
            description,
            customer_need,
            proposed_solution,
            status,
            products
        } = req.body;

        if (!account_id || !primary_contact_id) {
            return res.status(400).json({
                error: "account_id and primary_contact_id are required"
            });
        }

        await transaction.begin();

        const updateRequest = new sql.Request(transaction);

        await updateRequest
            .input("id", sql.Int, id)
            .input("topic", sql.NVarChar, topic || null)
            .input("account_id", sql.Int, Number(account_id))
            .input("primary_contact_id", sql.Int, Number(primary_contact_id))
            .input("budget_amount", sql.Decimal(18, 2), Number(budget_amount) || 0)
            .input("purchase_timeframe", sql.NVarChar, purchase_timeframe || "Unknown")
            .input("purchase_process", sql.NVarChar, purchase_process || "Unknown")
            .input("currency", sql.NVarChar, currency || "USD")
            .input("description", sql.NVarChar, description || null)
            .input("customer_need", sql.NVarChar, customer_need || null)
            .input("proposed_solution", sql.NVarChar, proposed_solution || null)
            .input("status", sql.NVarChar, status || "New")
            .execute("sp_UpdateOpportunity");

        const clearRequest = new sql.Request(transaction);

        await clearRequest
            .input("opportunity_id", sql.Int, id)
            .execute("sp_ClearOpportunityProducts");

        if (products?.length) {
            for (const p of products) {
                const productRequest = new sql.Request(transaction);

                await productRequest
                    .input("opportunity_id", sql.Int, id)
                    .input("product_id", sql.Int, p.product_id)
                    .input("quantity", sql.Decimal(18, 2), p.quantity || 0)
                    .input("price_per_unit", sql.Decimal(18, 2), p.price_per_unit || 0)
                    .input("manual_discount", sql.Decimal(18, 2), p.manual_discount || 0)
                    .input("tax_amount", sql.Decimal(18, 2), p.tax_amount || 0)
                    .execute("sp_AddOpportunityProduct");
            }
        }

        await transaction.commit();

        res.json({ message: "Opportunity updated successfully" });

    } catch (err) {

        console.error("UPDATE ERROR:", err);

        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        res.status(500).json({ error: "Failed to update opportunity" });
    }
});

// =========================
// MARK OPPORTUNITY AS WON
// =========================
router.post("/:id/won", async (req, res) => {
    try {
        const pool = await poolPromise;
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const result = await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_MarkOpportunityWon");

        const quoteId = result.recordset[0].quote_id;

        res.json({ message: "Opportunity marked as Won", quote_id: quoteId });

    } catch (err) {
        console.error("WON ERROR:", err);

        if (err.message?.includes("Opportunity not found")) {
            return res.status(404).json({ error: "Opportunity not found" });
        }

        res.status(500).json({ error: "Failed to mark opportunity as won" });
    }
});

// =========================
// MARK OPPORTUNITY AS LOST
// =========================
router.post("/:id/lost", async (req, res) => {
    try {
        const pool = await poolPromise;
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const { lost_to_competitor_product_id } = req.body;

        await pool.request()
            .input("id", sql.Int, id)
            .input("lost_to_competitor_product_id", sql.Int, lost_to_competitor_product_id || null)
            .execute("sp_MarkOpportunityLost");

        res.json({ message: "Opportunity marked as lost." });

    } catch (err) {
        console.error("LOST ERROR:", err);
        res.status(500).json({ error: "Failed to mark opportunity as lost" });
    }
});

// =========================
// DELETE OPPORTUNITY
// =========================
router.delete("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_DeleteOpportunity");

        res.json({ message: "Opportunity deleted successfully" });

    } catch (err) {
        console.error("DELETE ERROR:", err);

        if (err.message?.includes("linked to a converted lead")) {
            return res.status(409).json({
                error: "Cannot delete opportunity: linked to a converted lead"
            });
        }

        res.status(500).json({ error: "Failed to delete opportunity" });
    }
});

// =========================
// Fetch competitors for a product
// =========================
router.get("/product/:productId/competitors", async (req, res) => {
    try {
        const pool = await poolPromise;
        const productId = parseInt(req.params.productId);

        if (!productId) {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const result = await pool.request()
            .input("productId", sql.Int, productId)
            .execute("sp_GetProductCompetitors");

        res.json(result.recordset);

    } catch (err) {
        console.error("GET PRODUCT COMPETITORS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch product competitors" });
    }
});

// =========================
// Fetch selected competitors for opportunity product
// =========================
router.get("/:id/products/:productId/competitors", async (req, res) => {
    try {
        const pool = await poolPromise;
        const opportunityId = parseInt(req.params.id);
        const productId = parseInt(req.params.productId);

        if (!opportunityId || !productId) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const result = await pool.request()
            .input("opportunityId", sql.Int, opportunityId)
            .input("productId", sql.Int, productId)
            .execute("sp_GetOpportunityProductCompetitors");

        res.json(result.recordset);

    } catch (err) {
        console.error("GET SELECTED COMPETITORS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch selected competitors" });
    }
});

// =========================
// Save competitors for opportunity product
// =========================
router.put("/:id/products/:productId/competitors", async (req, res) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        const opportunityId = parseInt(req.params.id);
        const productId = parseInt(req.params.productId);
        const { competitor_product_ids } = req.body;

        if (!opportunityId || !productId) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        await transaction.begin();

        const clearRequest = new sql.Request(transaction);

        await clearRequest
            .input("opportunityId", sql.Int, opportunityId)
            .input("productId", sql.Int, productId)
            .execute("sp_ClearOpportunityProductCompetitors");

        if (competitor_product_ids?.length) {
            for (const competitorProductId of competitor_product_ids) {
                const addRequest = new sql.Request(transaction);

                await addRequest
                    .input("opportunityId", sql.Int, opportunityId)
                    .input("productId", sql.Int, productId)
                    .input("competitorProductId", sql.Int, competitorProductId)
                    .execute("sp_AddOpportunityProductCompetitor");
            }
        }

        await transaction.commit();

        res.json({ message: "Competitors updated successfully" });

    } catch (err) {

        console.error("SAVE COMPETITORS ERROR:", err);

        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        res.status(500).json({ error: "Failed to update competitors" });
    }
});

module.exports = router;