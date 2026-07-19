const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ===================== GET ALL =====================
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .execute("sp_GetAllCompetitors");

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch competitors" });
    }
});

// ===================== GET BY ID =====================
router.get("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;
        const competitorId = parseInt(req.params.id);

        if (!competitorId) {
            return res.status(400).json({ message: "Invalid competitor ID" });
        }

        const result = await pool.request()
            .input("id", sql.Int, competitorId)
            .execute("sp_GetCompetitorById");

        if (result.recordsets[0].length === 0) {
            return res.status(404).json({ message: "Competitor not found" });
        }

        res.json({
            ...result.recordsets[0][0],
            products: result.recordsets[1] || []
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch competitor" });
    }
});

// ===================== CREATE =====================
router.post("/", async (req, res) => {
    try {
        const {
            name,
            website,
            currency,
            street_1,
            street_2,
            street_3,
            city,
            state_province,
            zip_postal_code,
            country_region,
            strength,
            weakness
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "name is required" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("name", sql.NVarChar, name)
            .input("website", sql.NVarChar, website || null)
            .input("currency", sql.NVarChar, currency || null)
            .input("street_1", sql.NVarChar, street_1 || null)
            .input("street_2", sql.NVarChar, street_2 || null)
            .input("street_3", sql.NVarChar, street_3 || null)
            .input("city", sql.NVarChar, city || null)
            .input("state_province", sql.NVarChar, state_province || null)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code || null)
            .input("country_region", sql.NVarChar, country_region || null)
            .input("strength", sql.NVarChar, strength || null)
            .input("weakness", sql.NVarChar, weakness || null)
            .execute("sp_CreateCompetitor");

        res.status(201).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create competitor" });
    }
});

// ===================== UPDATE =====================
router.put("/:id", async (req, res) => {
    try {
        const competitorId = parseInt(req.params.id);

        if (!competitorId) {
            return res.status(400).json({ message: "Invalid competitor ID" });
        }

        const {
            name,
            website,
            currency,
            street_1,
            street_2,
            street_3,
            city,
            state_province,
            zip_postal_code,
            country_region,
            strength,
            weakness
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "name is required" });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, competitorId)
            .input("name", sql.NVarChar, name)
            .input("website", sql.NVarChar, website || null)
            .input("currency", sql.NVarChar, currency || null)
            .input("street_1", sql.NVarChar, street_1 || null)
            .input("street_2", sql.NVarChar, street_2 || null)
            .input("street_3", sql.NVarChar, street_3 || null)
            .input("city", sql.NVarChar, city || null)
            .input("state_province", sql.NVarChar, state_province || null)
            .input("zip_postal_code", sql.NVarChar, zip_postal_code || null)
            .input("country_region", sql.NVarChar, country_region || null)
            .input("strength", sql.NVarChar, strength || null)
            .input("weakness", sql.NVarChar, weakness || null)
            .execute("sp_UpdateCompetitor");

        res.json({ message: "Competitor updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update competitor" });
    }
});

// ===================== DELETE PRODUCT MAPPING =====================
// MUST be registered BEFORE DELETE /:id — Express reads routes top-to-bottom;
// if /:id came first, a request to /products/5 would match it with id="products"
router.delete("/products/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_DeleteCompetitorProduct");

        res.json({ message: "Competitor product deleted" });

    } catch (err) {
        console.error(err);

        if (err.message?.includes("linked to one or more opportunities")) {
            return res.status(409).json({
                message: "Cannot delete: this product mapping is linked to one or more opportunities"
            });
        }

        res.status(500).json({ message: "Failed to delete competitor product" });
    }
});

// ===================== DELETE COMPETITOR =====================
router.delete("/:id", async (req, res) => {
    try {
        const competitorId = parseInt(req.params.id);

        if (!competitorId) {
            return res.status(400).json({ message: "Invalid competitor ID" });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, competitorId)
            .execute("sp_DeleteCompetitor");

        res.json({ message: "Competitor deleted successfully" });

    } catch (err) {
        console.error(err);

        if (err.message?.includes("linked to one or more opportunities")) {
            return res.status(409).json({
                message: "Cannot delete: this competitor is linked to one or more opportunities"
            });
        }

        res.status(500).json({ message: "Failed to delete competitor" });
    }
});

// ===================== ADD PRODUCT MAPPING =====================
router.post("/:id/products", async (req, res) => {
    try {
        const competitorId = parseInt(req.params.id);

        if (!competitorId) {
            return res.status(400).json({ message: "Invalid competitor ID" });
        }

        const {
            product_id,
            competitor_product_name,
            notes
        } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input("competitor_id", sql.Int, competitorId)
            .input("product_id", sql.Int, product_id || null)
            .input("competitor_product_name", sql.NVarChar, competitor_product_name || null)
            .input("notes", sql.NVarChar, notes || null)
            .execute("sp_AddCompetitorProduct");

        res.status(201).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add competitor product" });
    }
});

// ===================== UPDATE PRODUCT MAPPING =====================
router.put("/products/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (!id) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const {
            product_id,
            competitor_product_name,
            notes
        } = req.body;

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, id)
            .input("product_id", sql.Int, product_id || null)
            .input("competitor_product_name", sql.NVarChar, competitor_product_name || null)
            .input("notes", sql.NVarChar, notes || null)
            .execute("sp_UpdateCompetitorProduct");

        res.json({ message: "Competitor product updated" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update competitor product" });
    }
});

// ===================== GET COMPETITORS BY PRODUCT =====================
router.get("/product/:productId", async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        if (!productId) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("productId", sql.Int, productId)
            .execute("sp_GetCompetitorsByProduct");

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch competitors by product" });
    }
});


module.exports = router;