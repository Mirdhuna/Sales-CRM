const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

const parseId = (val) => {
    const n = parseInt(val, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const toNull = (v) => (v === undefined || v === "" ? null : v);

// GET ALL ORDERS
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute("sp_GetAllOrders");
        res.json(result.recordset);
    } catch (err) {
        console.error("GET ORDERS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

// GET ORDER BY ID
router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid order ID" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("OrderId", sql.Int, id)
            .execute("sp_GetOrderById");

        const order = result.recordsets?.[0]?.[0];
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.products = result.recordsets?.[1] || [];
        res.json(order);
    } catch (err) {
        console.error("GET ORDER ERROR:", err);
        res.status(500).json({ message: "Failed to fetch order" });
    }
});

// POST /from-quote
router.post("/from-quote", async (req, res) => {
    const quoteId = parseId(req.body.quoteId);
    if (!quoteId) return res.status(400).json({ message: "Valid quoteId is required" });

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const quoteResult = await new sql.Request(transaction)
                .input("quoteId", sql.Int, quoteId)
                .query(`SELECT * FROM quotes WHERE quote_id = @quoteId`);

            if (!quoteResult.recordset.length) {
                await transaction.rollback();
                return res.status(404).json({ message: "Quote not found" });
            }

            const quote = quoteResult.recordset[0];

            const productsResult = await new sql.Request(transaction)
                .input("quoteId", sql.Int, quoteId)
                .query(`SELECT * FROM quote_products WHERE quote_id = @quoteId`);

            const quoteProducts = productsResult.recordset;

            const totalAmount = quoteProducts.reduce((sum, p) => {
                const amount = Number(p.price_per_unit || 0) * Number(p.quantity || 0);
                return sum + amount - Number(p.manual_discount || 0) + Number(p.tax_amount || 0);
            }, 0);

            const orderCode = `ORD-${Date.now()}`;
            const defaultOrderStatus = "Active";

            const orderResult = await new sql.Request(transaction)
                .input("order_code", sql.NVarChar(50), orderCode)
                .input("quote_id", sql.Int, quoteId)
                .input("account_id", sql.Int, quote.account_id)
                .input("opportunity_id", sql.Int, quote.opportunity_id)
                .input("topic", sql.NVarChar(255), toNull(quote.topic))
                .input("status", sql.NVarChar(50), defaultOrderStatus)
                .input("currency", sql.NVarChar(50), toNull(quote.currency))
                .input("payment_terms", sql.NVarChar(255), toNull(quote.payment_terms))
                .input("shipping_method", sql.NVarChar(255), toNull(quote.shipping_method))
                .input("requested_delivery", sql.NVarChar(100), toNull(quote.requested_delivery))
                .input("bill_to_street_1", sql.NVarChar(255), toNull(quote.bill_to_street_1))
                .input("bill_to_street_2", sql.NVarChar(255), toNull(quote.bill_to_street_2))
                .input("bill_to_street_3", sql.NVarChar(255), toNull(quote.bill_to_street_3))
                .input("bill_to_city", sql.NVarChar(100), toNull(quote.bill_to_city))
                .input("bill_to_state", sql.NVarChar(100), toNull(quote.bill_to_state))
                .input("bill_to_zip", sql.NVarChar(20), toNull(quote.bill_to_zip))
                .input("bill_to_country", sql.NVarChar(100), toNull(quote.bill_to_country))
                .input("ship_to_street_1", sql.NVarChar(255), toNull(quote.ship_to_street_1))
                .input("ship_to_street_2", sql.NVarChar(255), toNull(quote.ship_to_street_2))
                .input("ship_to_street_3", sql.NVarChar(255), toNull(quote.ship_to_street_3))
                .input("ship_to_city", sql.NVarChar(100), toNull(quote.ship_to_city))
                .input("ship_to_state", sql.NVarChar(100), toNull(quote.ship_to_state))
                .input("ship_to_zip", sql.NVarChar(20), toNull(quote.ship_to_zip))
                .input("ship_to_country", sql.NVarChar(100), toNull(quote.ship_to_country))
                .input("total_amount", sql.Decimal(18, 2), totalAmount)
                .execute("sp_CreateOrder");

            const orderId = orderResult.recordset?.[0]?.order_id;

            if (!orderId) {
                throw new Error("Order ID was not returned");
            }

            for (const p of quoteProducts) {
                await new sql.Request(transaction)
                    .input("order_id", sql.Int, orderId)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddOrderProduct");
            }

            await new sql.Request(transaction)
                .input("order_id", sql.Int, orderId)
                .execute("sp_RecalculateOrderTotal");

            await new sql.Request(transaction)
                .input("quoteId", sql.Int, quoteId)
                .query(`UPDATE quotes SET status = 'Won' WHERE quote_id = @quoteId`);

            await transaction.commit();

            res.status(201).json({
                message: "Order created successfully from quote",
                order_id: orderId,
                order_code: orderCode
            });
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        console.error("CREATE ORDER FROM QUOTE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id
router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid order ID" });

    try {
        const pool = await poolPromise;

        const check = await pool.request()
            .input("id", sql.Int, id)
            .query(`SELECT order_id FROM orders WHERE order_id = @id`);

        if (!check.recordset.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        await pool.request()
            .input("id", sql.Int, id)
            .input("topic", sql.NVarChar(255), toNull(req.body.topic))
            .input("status", sql.NVarChar(50), toNull(req.body.status))
            .input("currency", sql.NVarChar(50), toNull(req.body.currency))
            .input("payment_terms", sql.NVarChar(255), toNull(req.body.payment_terms))
            .input("shipping_method", sql.NVarChar(255), toNull(req.body.shipping_method))
            .input("requested_delivery", sql.NVarChar(100), toNull(req.body.requested_delivery))
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
            .execute("sp_UpdateOrder");

        if (req.body.products !== undefined) {
            await pool.request()
                .input("id", sql.Int, id)
                .query(`DELETE FROM order_products WHERE order_id = @id`);

            for (const p of (req.body.products || [])) {
                await pool.request()
                    .input("order_id", sql.Int, id)
                    .input("product_id", sql.Int, p.product_id)
                    .input("unit_of_measure", sql.NVarChar(50), toNull(p.unit_of_measure))
                    .input("price_per_unit", sql.Decimal(18, 2), Number(p.price_per_unit || 0))
                    .input("quantity", sql.Decimal(18, 2), Number(p.quantity || 0))
                    .input("manual_discount", sql.Decimal(18, 2), Number(p.manual_discount || 0))
                    .input("tax_amount", sql.Decimal(18, 2), Number(p.tax_amount || 0))
                    .execute("sp_AddOrderProduct");
            }

            await pool.request()
                .input("order_id", sql.Int, id)
                .execute("sp_RecalculateOrderTotal");
        }

        res.json({ message: "Order updated successfully" });
    } catch (err) {
        console.error("UPDATE ORDER ERROR:", err);
        res.status(500).json({ message: "Update failed", error: err.message });
    }
});

// PATCH /:id/close
router.patch("/:id/close", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid order ID" });

    try {
        const pool = await poolPromise;

        const check = await pool.request()
            .input("id", sql.Int, id)
            .query(`SELECT order_id FROM orders WHERE order_id = @id`);

        if (!check.recordset.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        await pool.request()
            .input("id", sql.Int, id)
            .query(`UPDATE orders SET status = 'Cancelled' WHERE order_id = @id`);

        res.json({ message: "Order closed successfully" });
    } catch (err) {
        console.error("CLOSE ORDER ERROR:", err);
        res.status(500).json({ message: "Failed to close order", error: err.message });
    }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid order ID" });

    try {
        const pool = await poolPromise;

        const check = await pool.request()
            .input("id", sql.Int, id)
            .query(`SELECT order_id FROM orders WHERE order_id = @id`);

        if (!check.recordset.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        await pool.request()
            .input("id", sql.Int, id)
            .execute("sp_DeleteOrder");

        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("DELETE ORDER ERROR:", err);
        res.status(500).json({ message: "Delete failed" });
    }
});

module.exports = router;