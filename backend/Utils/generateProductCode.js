const { poolPromise } = require("../db");

const generateProductCode = async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT TOP 1 product_code
        FROM products
        WHERE product_code IS NOT NULL
        ORDER BY product_id DESC
    `);

    let nextNumber = 1;

    if (result.recordset.length > 0) {
        const lastCode = result.recordset[0].product_code; // PRD-0007

        const num = parseInt(lastCode.split("-")[1], 10);
        nextNumber = num + 1;
    }

    return `PRD-${String(nextNumber).padStart(4, "0")}`;
};

module.exports = generateProductCode;