import sql from "mssql";
import {poolPromise} from "../db.js";

// =========================================
// GET ALL ORDERS
// =========================================

export const getOrders = async (req, res) => {
    try {

        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT o.order_id,
            o.order_code,
            o.topic,
            o.status,
            o.total_amount,
            o.requested_delivery,
            o.created_at,
            q.quote_id,
            a.account_name
            FROM orders o
            LEFT JOIN quotes q
                ON o.quote_id = q.quote_id
            LEFT JOIN accounts a 
                ON o.account_id=a.account_id
            ORDER BY o.order_id DESC
        `);

        res.json(result.recordset);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
};


// =========================================
// GET ORDER BY ID
// =========================================

export const getOrderById = async (req, res) => {

    try {

        const { id } = req.params;

        const pool = await poolPromise;

        // FIX: Use parameterized query instead of string interpolation (SQL injection risk)
        const orderResult = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT *
                FROM orders
                WHERE order_id = @id
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // FIX: Use parameterized query instead of string interpolation (SQL injection risk)
        const productsResult = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT
                    op.*,
                    p.product_name
                FROM order_products op
                JOIN products p
                    ON op.product_id = p.product_id
                WHERE op.order_id = @id
            `);

        const order = orderResult.recordset[0];

        order.products = productsResult.recordset;

        res.json(order);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to fetch order"
        });
    }
};


// =========================================
// CREATE ORDER FROM QUOTE
// =========================================

export const createOrderFromQuote = async (req, res) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        const { quoteId } = req.body;

        // ---------------------------
        // Check Existing Order
        // ---------------------------

        const existingOrder = await transaction.request()
            .input("quoteId", sql.Int, quoteId)
            .query(`
                SELECT order_id
                FROM orders
                WHERE quote_id = @quoteId
            `);

        if (existingOrder.recordset.length > 0) {

            await transaction.rollback();

            return res.status(400).json({
                message: "Order already exists for this quote"
            });
        }

        // ---------------------------
        // Get Quote
        // ---------------------------

        const quoteResult = await transaction.request()
            .input("quoteId", sql.Int, quoteId)
            .query(`
                SELECT *
                FROM quotes
                WHERE quote_id = @quoteId
            `);

        const quote = quoteResult.recordset[0];

        if (!quote) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Quote not found"
            });
        }

        // ---------------------------
        // Generate Order Code
        // ---------------------------

        const orderCode =
            "ORD-" + Date.now();

        // ---------------------------
        // Insert Order
        // ---------------------------

        const orderResult = await transaction.request()

            .input("order_code", sql.NVarChar, orderCode)

            .input("opportunity_id", sql.Int, quote.opportunity_id)
            .input("account_id", sql.Int, quote.account_id)
            .input("quote_id", sql.Int, quote.quote_id)

            .input("topic", sql.NVarChar, quote.topic)

            .input("currency", sql.NVarChar, quote.currency)
            .input("payment_terms", sql.NVarChar, quote.payment_terms)
            .input("shipping_method", sql.NVarChar, quote.shipping_method)

            .input("bill_to_street_1", sql.NVarChar, quote.bill_to_street_1)
            .input("bill_to_street_2", sql.NVarChar, quote.bill_to_street_2)
            .input("bill_to_street_3", sql.NVarChar, quote.bill_to_street_3)

            .input("bill_to_city", sql.NVarChar, quote.bill_to_city)
            .input("bill_to_state", sql.NVarChar, quote.bill_to_state)
            .input("bill_to_zip", sql.NVarChar, quote.bill_to_zip)
            .input("bill_to_country", sql.NVarChar, quote.bill_to_country)

            .input("ship_to_street_1", sql.NVarChar, quote.ship_to_street_1)
            .input("ship_to_street_2", sql.NVarChar, quote.ship_to_street_2)
            .input("ship_to_street_3", sql.NVarChar, quote.ship_to_street_3)

            .input("ship_to_city", sql.NVarChar, quote.ship_to_city)
            .input("ship_to_state", sql.NVarChar, quote.ship_to_state)
            .input("ship_to_zip", sql.NVarChar, quote.ship_to_zip)
            .input("ship_to_country", sql.NVarChar, quote.ship_to_country)

            .input("detail_amount", sql.Decimal(18, 2), quote.detail_amount)
            .input("total_discount", sql.Decimal(18, 2), quote.total_discount)
            .input("total_tax", sql.Decimal(18, 2), quote.total_tax)
            .input("total_amount", sql.Decimal(18, 2), quote.total_amount)

            .query(`
                INSERT INTO orders
                (
                    order_code,
                    opportunity_id,
                    account_id,
                    quote_id,
                    topic,
                    currency,
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

                    status
                )
                OUTPUT INSERTED.order_id
                VALUES
                (
                    @order_code,
                    @opportunity_id,
                    @account_id,
                    @quote_id,
                    @topic,
                    @currency,
                    @payment_terms,
                    @shipping_method,

                    @bill_to_street_1,
                    @bill_to_street_2,
                    @bill_to_street_3,
                    @bill_to_city,
                    @bill_to_state,
                    @bill_to_zip,
                    @bill_to_country,

                    @ship_to_street_1,
                    @ship_to_street_2,
                    @ship_to_street_3,
                    @ship_to_city,
                    @ship_to_state,
                    @ship_to_zip,
                    @ship_to_country,

                    @detail_amount,
                    @total_discount,
                    @total_tax,
                    @total_amount,

                    'Active'
                )
            `);

        const orderId =
            orderResult.recordset[0].order_id;

        // ---------------------------
        // Get Quote Products
        // ---------------------------

        const productsResult = await transaction.request()
            .input("quoteId", sql.Int, quoteId)
            .query(`
                SELECT *
                FROM quote_products
                WHERE quote_id = @quoteId
            `);

        // ---------------------------
        // Copy Products
        // ---------------------------

        for (const product of productsResult.recordset) {

            await transaction.request()

                .input("order_id", sql.Int, orderId)
                .input("product_id", sql.Int, product.product_id)
                .input("unit_of_measure", sql.NVarChar, product.unit_of_measure)
                .input("price_per_unit", sql.Decimal(18, 2), product.price_per_unit)
                .input("quantity", sql.Decimal(18, 2), product.quantity)
                .input("manual_discount", sql.Decimal(18, 2), product.manual_discount)
                .input("tax_amount", sql.Decimal(18, 2), product.tax_amount)
                .input("total_amount", sql.Decimal(18, 2), product.total_amount)

                .query(`
                    INSERT INTO order_products
                    (
                        order_id,
                        product_id,
                        unit_of_measure,
                        price_per_unit,
                        quantity,
                        manual_discount,
                        tax_amount,
                        total_amount
                    )
                    VALUES
                    (
                        @order_id,
                        @product_id,
                        @unit_of_measure,
                        @price_per_unit,
                        @quantity,
                        @manual_discount,
                        @tax_amount,
                        @total_amount
                    )
                `);
        }

        // ---------------------------
        // Update Quote Status
        // ---------------------------

        await transaction.request()
            .input("quoteId", sql.Int, quoteId)
            .query(`
                UPDATE quotes
                SET status = 'won'
                WHERE quote_id = @quoteId
            `);

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order_id: orderId
        });

    } catch (err) {

        await transaction.rollback();

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
};


// =========================================
// CLOSE ORDER
// =========================================

export const closeOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        // FIX: Replaced ORM-based Order.findByPk() with raw mssql parameterized query
        const orderResult = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT order_id
                FROM orders
                WHERE order_id = @id
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        await pool.request()
            .input("id", sql.Int, id)
            .query(`
                UPDATE orders
                SET status = 'Lost'
                WHERE order_id = @id
            `);

        res.json({
            message: "Order closed successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// DELETE ORDER

export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        const check = await pool.request()
            .input("order_id", sql.Int, id)
            .query(`SELECT order_id FROM orders WHERE order_id = @order_id`);

        if (check.recordset.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        await pool.request()
            .input("order_id", sql.Int, id)
            .query(`DELETE FROM orders WHERE order_id = @order_id`);

        return res.json({ message: "Order deleted successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};
