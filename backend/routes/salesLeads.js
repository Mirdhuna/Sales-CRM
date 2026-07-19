const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../db");

/* ===========================================
   GET ALL SALES LEADS
=========================================== */
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT *
            FROM vw_SalesLeadList
            ORDER BY lead_id DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch sales leads"
        });
    }
});


/* ===========================================
   GET SALES LEAD BY ID
=========================================== */
router.get("/:id", async (req, res) => {

    try {

        const leadId = parseInt(req.params.id);

        const pool = await poolPromise;

        const leadResult = await pool.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_GetSalesLeadById");

        if (leadResult.recordset.length === 0) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        const competitorResult = await pool.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_GetLeadCompetitors");

        const lead = leadResult.recordset[0];

        lead.competitors = competitorResult.recordset.map(
            c => c.competitor_id
        );

        res.json(lead);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to fetch lead"
        });

    }

});


/* ===========================================
   CREATE SALES LEAD
=========================================== */
router.post("/", async (req, res) => {

    const transaction = new sql.Transaction(await poolPromise);

    try {

        await transaction.begin();

        const {
            topic,
            company_name,
            industry,
            company_phone,
            company_website,

            street,
            city,
            state_province,
            zip_postal_code,
            country_region,

            first_name,
            last_name,
            email,
            job_title,
            phone,
            fax,
            gender,

            currency,
            payment_terms,
            shipping_method,
            contact_method,

            rating,
            order_type,
            purchase_timeframe,
            estimated_budget,
            purchase_process,

            description,
            capture_summary,

            status,

            competitors = []
        } = req.body;


        const insertResult = await transaction.request()

            .input("first_name", sql.NVarChar, first_name)
            .input("last_name", sql.NVarChar, last_name)

            .input("email", sql.NVarChar, email || null)
            .input("job_title", sql.NVarChar, job_title || null)

            .input("phone", sql.NVarChar, phone || null)
            .input("fax", sql.NVarChar, fax || null)

            .input("gender", sql.NVarChar, gender || null)
            .input("topic", sql.NVarChar, topic)

            .input("company_name", sql.NVarChar, company_name)

            .input("industry", sql.NVarChar, industry || null)
            .input("company_phone", sql.NVarChar, company_phone || null)
            .input("company_website", sql.NVarChar, company_website || null)

            .input("street", sql.NVarChar, street || null)
            .input("city", sql.NVarChar, city || null)
            .input("state_province", sql.NVarChar, state_province || null)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code || null)
            .input("country_region", sql.NVarChar, country_region || null)
            .input("currency", sql.NVarChar, currency || "INR")

            .input("payment_terms", sql.NVarChar, payment_terms || null)
            .input("shipping_method", sql.NVarChar, shipping_method || null)
            .input("contact_method", sql.NVarChar, contact_method || null)

            .input("rating", sql.NVarChar, rating || null)
            .input("order_type", sql.NVarChar, order_type || null)

            .input(
                "purchase_timeframe",
                sql.NVarChar,
                purchase_timeframe || null
            )

            .input(
                "estimated_budget",
                sql.Decimal(18, 2),
                estimated_budget === "" ||
                    estimated_budget === null ||
                    estimated_budget === undefined
                    ? null
                    : Number(estimated_budget)
            )

            .input(
                "purchase_process",
                sql.NVarChar,
                purchase_process || null
            )

            .input(
                "description",
                sql.NVarChar(sql.MAX),
                description || null
            )

            .input(
                "capture_summary",
                sql.NVarChar(sql.MAX),
                capture_summary || null
            )

            .input(
                "status",
                sql.NVarChar,
                status || "Active"
            )
            .execute("sp_CreateSalesLead");


        const leadId = insertResult.recordset[0].lead_id;


        for (const competitorId of competitors) {

            await transaction.request()
                .input("leadId", sql.Int, leadId)
                .input("competitorId", sql.Int, competitorId)
                .execute("sp_AddLeadCompetitor");

        }

        await transaction.commit();

        res.status(201).json({
            message: "Lead created successfully",
            lead_id: leadId
        });

    } catch (err) {

        await transaction.rollback();

        console.error(err);

        res.status(500).json({
            error: "Failed to create lead"
        });

    }

});

/* ===========================================
   UPDATE SALES LEAD
=========================================== */
router.put("/:id", async (req, res) => {

    const transaction = new sql.Transaction(await poolPromise);

    try {

        await transaction.begin();

        const leadId = parseInt(req.params.id);

        if (isNaN(leadId)) {
            await transaction.rollback();

            return res.status(400).json({
                error: "Invalid lead ID"
            });
        }

        const {
            topic,
            company_name,
            industry,
            company_phone,
            company_website,

            street,
            city,
            state_province,
            zip_postal_code,
            country_region,

            first_name,
            last_name,
            email,
            job_title,
            phone,
            fax,
            gender,

            currency,
            payment_terms,
            shipping_method,
            contact_method,

            rating,
            order_type,
            purchase_timeframe,
            estimated_budget,
            purchase_process,

            description,
            capture_summary,

            status,

            competitors = []
        } = req.body;

        /* Check if lead exists */
        const existingLead = await transaction.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_CheckLeadExists");

        if (existingLead.recordset.length === 0) {

            await transaction.rollback();

            return res.status(404).json({
                error: "Lead not found"
            });
        }

        /* Update lead */
        const updateResult = await transaction.request()

            .input("leadId", sql.Int, leadId)

            .input("topic", sql.NVarChar, topic)

            .input("company_name", sql.NVarChar, company_name)
            .input("industry", sql.NVarChar, industry || null)
            .input("company_phone", sql.NVarChar, company_phone || null)
            .input("company_website", sql.NVarChar, company_website || null)

            .input("street", sql.NVarChar, street || null)
            .input("city", sql.NVarChar, city || null)
            .input("state_province", sql.NVarChar, state_province || null)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code || null)
            .input("country_region", sql.NVarChar, country_region || null)

            .input("first_name", sql.NVarChar, first_name)
            .input("last_name", sql.NVarChar, last_name)

            .input("email", sql.NVarChar, email || null)
            .input("job_title", sql.NVarChar, job_title || null)

            .input("phone", sql.NVarChar, phone || null)
            .input("fax", sql.NVarChar, fax || null)

            .input("gender", sql.NVarChar, gender || null)

            .input("currency", sql.NVarChar, currency || "INR")

            .input("payment_terms", sql.NVarChar, payment_terms || null)
            .input("shipping_method", sql.NVarChar, shipping_method || null)
            .input("contact_method", sql.NVarChar, contact_method || null)

            .input("rating", sql.NVarChar, rating || null)
            .input("order_type", sql.NVarChar, order_type || null)

            .input(
                "purchase_timeframe",
                sql.NVarChar,
                purchase_timeframe || null
            )

            .input(
                "estimated_budget",
                sql.Decimal(18, 2),
                estimated_budget === "" ||
                    estimated_budget === null ||
                    estimated_budget === undefined
                    ? null
                    : Number(estimated_budget)
            )

            .input(
                "purchase_process",
                sql.NVarChar,
                purchase_process || null
            )

            .input(
                "description",
                sql.NVarChar(sql.MAX),
                description || null
            )

            .input(
                "capture_summary",
                sql.NVarChar(sql.MAX),
                capture_summary || null
            )

            .input(
                "status",
                sql.NVarChar,
                status || "Active"
            )
            .execute("sp_UpdateSalesLead");
        console.log("Rows affected:", updateResult.rowsAffected);

        /* Update competitors */
        await transaction.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_DeleteLeadCompetitors");

        for (const competitorId of competitors) {

            await transaction.request()
                .input("leadId", sql.Int, leadId)
                .input("competitorId", sql.Int, competitorId)
                .execute("sp_AddLeadCompetitor");
        }

        await transaction.commit();

        res.json({
            message: "Lead updated successfully"
        });

    } catch (err) {

        await transaction.rollback();

        console.error(err);

        res.status(500).json({
            error: "Failed to update lead"
        });
    }
});

//Qulaify the Saleslead

router.put("/:id/qualify", async (req, res) => {

    try {

        const leadId = parseInt(req.params.id);

        if (isNaN(leadId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Lead ID"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_QualifyLead");

        res.status(200).json({
            success: true,
            message: "Lead qualified successfully",
            data: result.recordset[0]
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



/* ===========================================
   DELETE SALES LEAD
=========================================== */
router.delete("/:id", async (req, res) => {

    try {

        const leadId = parseInt(req.params.id);

        const pool = await poolPromise;

        await pool.request()
            .input("leadId", sql.Int, leadId)
            .execute("sp_DeleteLead");

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