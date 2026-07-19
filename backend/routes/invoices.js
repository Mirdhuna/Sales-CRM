const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

const parseId = (val) => {
    const n = parseInt(val, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const toNull = (v) => (v === undefined || v === "" ? null : v);

// GET ALL INVOICES
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute("sp_GetAllInvoices");
        res.json(result.recordset);
    } catch (err) {
        console.error("GET INVOICES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
    }
});

// GET INVOICE BY ID
router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid invoice ID" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("InvoiceId", sql.Int, id)
            .execute("sp_GetInvoiceById");

        const invoice = result.recordsets?.[0]?.[0];
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        invoice.products = result.recordsets?.[1] || [];
        res.json(invoice);
    } catch (err) {
        console.error("GET INVOICE ERROR:", err);
        res.status(500).json({ message: "Failed to fetch invoice", error: err.message });
    }
});

// CREATE INVOICE
router.post("/", async (req, res) => {



    try {
        const pool = await poolPromise;

        const existingInvoice = await pool.request()
            .input("opportunity_id", sql.Int, req.body.opportunity_id)
            .execute("sp_CheckInvoiceExists");

        if (existingInvoice.recordset.length > 0) {
            return res.status(400).json({
                message: "An invoice already exists for this opportunity"
            });
        }
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const {
            opportunity_id,
            account_id,
            order_id,
            topic,
            currency,
            due_date,
            date_delivered,
            payment_terms,
            shipping_method,
            bill_to_street_1,
            bill_to_street_2,
            bill_to_street_3,
            bill_to_city,
            bill_to_state,
            bill_to_zip,
            bill_to_country,
            ship_to_street_1,
            ship_to_street_2,
            ship_to_street_3,
            ship_to_city,
            ship_to_state,
            ship_to_zip,
            ship_to_country,
            detail_amount,
            total_discount,
            total_tax,
            total_amount,
            products
        } = req.body;

        const invoiceCode = `INV-${Date.now()}`;

        const invoiceResult = await new sql.Request(transaction)
            .input("invoice_code", sql.NVarChar(50), invoiceCode)
            .input("opportunity_id", sql.Int, opportunity_id || null)
            .input("account_id", sql.Int, account_id || null)
            .input("order_id", sql.Int, order_id || null)
            .input("topic", sql.NVarChar(255), toNull(topic))
            .input("currency", sql.NVarChar(50), toNull(currency) || "INR")
            .input("due_date", sql.Date, due_date)
            .input("date_delivered", sql.Date, date_delivered || null)
            .input("payment_terms", sql.NVarChar(255), toNull(payment_terms))
            .input("shipping_method", sql.NVarChar(255), toNull(shipping_method))
            .input("bill_to_street_1", sql.NVarChar(255), toNull(bill_to_street_1))
            .input("bill_to_street_2", sql.NVarChar(255), toNull(bill_to_street_2))
            .input("bill_to_street_3", sql.NVarChar(255), toNull(bill_to_street_3))
            .input("bill_to_city", sql.NVarChar(100), toNull(bill_to_city))
            .input("bill_to_state", sql.NVarChar(100), toNull(bill_to_state))
            .input("bill_to_zip", sql.NVarChar(20), toNull(bill_to_zip))
            .input("bill_to_country", sql.NVarChar(100), toNull(bill_to_country))
            .input("ship_to_street_1", sql.NVarChar(255), toNull(ship_to_street_1))
            .input("ship_to_street_2", sql.NVarChar(255), toNull(ship_to_street_2))
            .input("ship_to_street_3", sql.NVarChar(255), toNull(ship_to_street_3))
            .input("ship_to_city", sql.NVarChar(100), toNull(ship_to_city))
            .input("ship_to_state", sql.NVarChar(100), toNull(ship_to_state))
            .input("ship_to_zip", sql.NVarChar(20), toNull(ship_to_zip))
            .input("ship_to_country", sql.NVarChar(100), toNull(ship_to_country))
            .input("detail_amount", sql.Decimal(18, 2), Number(detail_amount || 0))
            .input("total_discount", sql.Decimal(18, 2), Number(total_discount || 0))
            .input("total_tax", sql.Decimal(18, 2), Number(total_tax || 0))
            .input("total_amount", sql.Decimal(18, 2), Number(total_amount || 0))
            .execute("sp_CreateInvoice");

        const invoiceId = invoiceResult.recordset?.[0]?.invoice_id;
        if (!invoiceId) throw new Error("Invoice ID was not returned");

        if (Array.isArray(products)) {
            for (const p of products) {
                await new sql.Request(transaction)
                    .input("invoice_id", sql.Int, invoiceId)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddInvoiceProduct");
            }

            await new sql.Request(transaction)
                .input("invoice_id", sql.Int, invoiceId)
                .execute("sp_RecalculateInvoiceTotals");
        }

        await transaction.commit();

        if (order_id) {
            await pool.request()
                .input("order_id", sql.Int, order_id)
                .query(`UPDATE orders SET status = 'Invoiced' WHERE order_id = @order_id`);
        }

        res.status(201).json({
            success: true,
            invoice_id: invoiceId,
            message: "Invoice created successfully"
        });
    } catch (err) {
        try { await transaction.rollback(); } catch (_) { }
        console.error("CREATE INVOICE ERROR:", err);
        res.status(500).json({ message: "Failed to create invoice", error: err.message });
    }
});

// UPDATE INVOICE
router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid invoice ID" });


    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        const lookup = await new sql.Request(transaction)
            .input("invoice_id", sql.Int, id)
            .query(`SELECT order_id FROM invoices WHERE invoice_id = @invoice_id`);

        if (!lookup.recordset.length) {
            await transaction.rollback();
            return res.status(404).json({ message: "Invoice not found" });
        }

        const order_id = lookup.recordset[0].order_id || null;

        const {
            topic,
            status,
            currency,
            due_date,
            date_delivered,
            payment_terms,
            shipping_method,
            bill_to_street_1,
            bill_to_street_2,
            bill_to_street_3,
            bill_to_city,
            bill_to_state,
            bill_to_zip,
            bill_to_country,
            ship_to_street_1,
            ship_to_street_2,
            ship_to_street_3,
            ship_to_city,
            ship_to_state,
            ship_to_zip,
            ship_to_country,
            detail_amount,
            total_discount,
            total_tax,
            total_amount,
            products
        } = req.body;

        await new sql.Request(transaction)
            .input("invoice_id", sql.Int, id)
            .input("topic", sql.NVarChar(255), toNull(topic))
            .input("status", sql.NVarChar(50), toNull(status))
            .input("currency", sql.NVarChar(50), toNull(currency) || "INR")
            .input("due_date", sql.Date, due_date)
            .input("date_delivered", sql.Date, date_delivered || null)
            .input("payment_terms", sql.NVarChar(255), toNull(payment_terms))
            .input("shipping_method", sql.NVarChar(255), toNull(shipping_method))
            .input("bill_to_street_1", sql.NVarChar(255), toNull(bill_to_street_1))
            .input("bill_to_street_2", sql.NVarChar(255), toNull(bill_to_street_2))
            .input("bill_to_street_3", sql.NVarChar(255), toNull(bill_to_street_3))
            .input("bill_to_city", sql.NVarChar(100), toNull(bill_to_city))
            .input("bill_to_state", sql.NVarChar(100), toNull(bill_to_state))
            .input("bill_to_zip", sql.NVarChar(20), toNull(bill_to_zip))
            .input("bill_to_country", sql.NVarChar(100), toNull(bill_to_country))
            .input("ship_to_street_1", sql.NVarChar(255), toNull(ship_to_street_1))
            .input("ship_to_street_2", sql.NVarChar(255), toNull(ship_to_street_2))
            .input("ship_to_street_3", sql.NVarChar(255), toNull(ship_to_street_3))
            .input("ship_to_city", sql.NVarChar(100), toNull(ship_to_city))
            .input("ship_to_state", sql.NVarChar(100), toNull(ship_to_state))
            .input("ship_to_zip", sql.NVarChar(20), toNull(ship_to_zip))
            .input("ship_to_country", sql.NVarChar(100), toNull(ship_to_country))
            .input("detail_amount", sql.Decimal(18, 2), Number(detail_amount || 0))
            .input("total_discount", sql.Decimal(18, 2), Number(total_discount || 0))
            .input("total_tax", sql.Decimal(18, 2), Number(total_tax || 0))
            .input("total_amount", sql.Decimal(18, 2), Number(total_amount || 0))
            .execute("sp_UpdateInvoice");

        await new sql.Request(transaction)
            .input("invoice_id", sql.Int, id)
            .query(`DELETE FROM invoice_products WHERE invoice_id = @invoice_id`);

        if (Array.isArray(products)) {
            for (const p of products) {
                await new sql.Request(transaction)
                    .input("invoice_id", sql.Int, id)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddInvoiceProduct");
            }

            await new sql.Request(transaction)
                .input("invoice_id", sql.Int, id)
                .execute("sp_RecalculateInvoiceTotals");
        }

        await transaction.commit();

        if (order_id) {
            await pool.request()
                .input("order_id", sql.Int, order_id)
                .query(`
                    UPDATE orders
                    SET status = CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM invoices
                            WHERE order_id = @order_id
                              AND status != 'Cancelled'
                        ) THEN 'Invoiced'
                        ELSE 'Active'
                    END
                    WHERE order_id = @order_id
                `);
        }

        res.json({
            success: true,
            message: "Invoice updated successfully"
        });
    } catch (err) {
        try { await transaction.rollback(); } catch (_) { }
        console.error("UPDATE INVOICE ERROR:", err);
        res.status(500).json({ message: "Failed to update invoice", error: err.message });
    }
});

// DELETE INVOICE
router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid invoice ID" });

    try {
        const pool = await poolPromise;

        const lookup = await pool.request()
            .input("invoice_id", sql.Int, id)
            .query(`SELECT order_id FROM invoices WHERE invoice_id = @invoice_id`);

        if (!lookup.recordset.length) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const order_id = lookup.recordset[0].order_id || null;

        await pool.request()
            .input("invoice_id", sql.Int, id)
            .execute("sp_DeleteInvoice");

        if (order_id) {
            await pool.request()
                .input("order_id", sql.Int, order_id)
                .query(`
                    UPDATE orders
                    SET status = CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM invoices
                            WHERE order_id = @order_id
                              AND status != 'Cancelled'
                        ) THEN 'Invoiced'
                        ELSE 'Active'
                    END
                    WHERE order_id = @order_id
                `);
        }

        res.json({
            success: true,
            message: "Invoice deleted successfully"
        });
    } catch (err) {
        console.error("DELETE INVOICE ERROR:", err);
        res.status(500).json({ message: "Failed to delete invoice", error: err.message });
    }
});

module.exports = router;