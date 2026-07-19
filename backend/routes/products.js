const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../db");
const generateProductCode = require("../Utils/generateProductCode")


// =========================
// Helper Function
// =========================
const parseId = (value) => {
    const id = parseInt(value, 10);
    return isNaN(id) ? null : id;
};

const ALLOWED_UOM = ["BAG", "BOX", "KG", "LIT", "PKT", "PCS"];

// =========================
// GET ALL PRODUCTS
// =========================
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .execute("sp_GetAllProducts");

        res.json(result.recordset);

    } catch (err) {
        console.error("GET PRODUCTS ERROR:", err);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
});

// =========================
// GET PRODUCT BY ID
// =========================
router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: "Invalid product ID"
        });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_GetProductById");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        console.error("GET PRODUCT ERROR:", err);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
});

// =========================
// CREATE PRODUCT
// =========================
router.post("/", async (req, res) => {
    try {
        const {
            product_name,
            list_price,
            cost_price,
            unit_of_measure,
            valid_from,
            valid_to,
            description
        } = req.body;

        if (!product_name || product_name.trim() === "") {
            return res.status(400).json({ message: "Product name is required" });
        }

        if (unit_of_measure && !ALLOWED_UOM.includes(unit_of_measure)) {
            return res.status(400).json({
                message: `Invalid unit_of_measure. Allowed values: ${ALLOWED_UOM.join(", ")}`
            });
        }

        if (list_price < 0 || cost_price < 0) {
            return res.status(400).json({
                message: "Prices cannot be negative"
            });
        }

        const pool = await poolPromise;

        // Auto-generated product code
        const product_code = await generateProductCode();

        await pool.request()
            .input("product_name", sql.NVarChar(200), product_name)
            .input("product_code", sql.NVarChar(100), product_code)
            .input("list_price", sql.Decimal(18, 2), list_price || 0)
            .input("cost_price", sql.Decimal(18, 2), cost_price || 0)
            .input("unit_of_measure", sql.NVarChar(50), unit_of_measure || null)
            .input("valid_from", sql.Date, valid_from || null)
            .input("valid_to", sql.Date, valid_to || null)
            .input("description", sql.NVarChar(sql.MAX), description || null)
            .execute("sp_CreateProduct");

        res.status(201).json({
            message: "Product created successfully",
            product_code
        });

    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);

        res.status(500).json({
            message: "Failed to create product"
        });
    }
});

// =========================
// UPDATE PRODUCT
// =========================
router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: "Invalid product ID"
        });
    }

    try {
        const {
            product_name,
            product_code,
            list_price,
            cost_price,
            unit_of_measure,
            valid_from,
            valid_to,
            description
        } = req.body;

        if (!product_name || product_name.trim() === "") {
            return res.status(400).json({ message: "Product name is required" });
        }

        if (unit_of_measure && !ALLOWED_UOM.includes(unit_of_measure)) {
            return res.status(400).json({
                message: `Invalid unit_of_measure. Allowed values: ${ALLOWED_UOM.join(", ")}`
            });
        }

        if (list_price < 0 || cost_price < 0) {
            return res.status(400).json({
                message: "Prices cannot be negative"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("product_name", sql.NVarChar(200), product_name)
            .input("product_code", sql.NVarChar(100), product_code)
            .input("list_price", sql.Decimal(18, 2), list_price || 0)
            .input("cost_price", sql.Decimal(18, 2), cost_price || 0)
            .input("unit_of_measure", sql.NVarChar(50), unit_of_measure || null)
            .input("valid_from", sql.Date, valid_from || null)
            .input("valid_to", sql.Date, valid_to || null)
            .input("description", sql.NVarChar(sql.MAX), description || null)
            .execute("sp_UpdateProduct");

        const rowsAffected = result.recordset[0].rows_affected;

        if (rowsAffected === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product updated successfully"
        });

    } catch (err) {
        console.error("UPDATE PRODUCT ERROR:", err);

        res.status(500).json({
            message: "Failed to update product"
        });
    }
});

// =========================
// DELETE PRODUCT
// =========================
router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: "Invalid product ID"
        });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_DeleteProduct");

        const { rows_affected, reason } = result.recordset[0];

        if (rows_affected === 0 && reason === "NOT_FOUND") {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (rows_affected === 0 && reason === "IN_USE") {
            return res.status(409).json({
                message: "Cannot delete product: it is referenced in opportunities, quotes, orders, invoices, or competitor mappings"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    } catch (err) {
        console.error("DELETE PRODUCT ERROR:", err);

        res.status(500).json({
            message: "Failed to delete product"
        });
    }
});

module.exports = router;