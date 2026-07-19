const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");


/* GET ALL CONTACTS */
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
        .execute("sp_GetAllContacts");

        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


/* GET CONTACT BY ID */
router.get("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .execute("sp_GetContactById");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "Contact not found"
            });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch contact"
        });
    }
});


/* CREATE CONTACT */
router.post("/", async (req, res) => {
    try {

        const {
            first_name,
            last_name,
            email,
            job_title,
            phone,
            fax,
            gender,
            address,
            contact_method,
            description,
            account_id
        } = req.body;

        const pool = await poolPromise;

        await pool.request()
            .input("first_name", sql.NVarChar, first_name)
            .input("last_name", sql.NVarChar, last_name)
            .input("email", sql.NVarChar, email)
            .input("job_title", sql.NVarChar, job_title)
            .input("phone", sql.NVarChar, phone)
            .input("fax", sql.NVarChar, fax)
            .input("gender", sql.NVarChar, gender)
            .input("address", sql.NVarChar, address)
            .input("contact_method", sql.NVarChar, contact_method || null)
            .input("description", sql.NVarChar, description || null)
            .input("account_id", sql.Int, account_id || null)

            .execute("sp_CreateContact");

        res.status(201).json({
            message: "Contact created successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


/* UPDATE CONTACT */
router.put("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            first_name,
            last_name,
            email,
            job_title,
            phone,
            fax,
            gender,
            address,
            contact_method,
            description,
            account_id
        } = req.body;

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, id)
            .input("first_name", sql.NVarChar, first_name)
            .input("last_name", sql.NVarChar, last_name)
            .input("email", sql.NVarChar, email)
            .input("job_title", sql.NVarChar, job_title)
            .input("phone", sql.NVarChar, phone)
            .input("fax", sql.NVarChar, fax)
            .input("gender", sql.NVarChar, gender)
            .input("address", sql.NVarChar, address)
            .input("contact_method", sql.NVarChar, contact_method)
            .input("description", sql.NVarChar, description)
            .input("account_id", sql.Int, account_id || null)

            .execute("sp_UpdateContact");

        res.status(200).json({
            message: "Contact updated successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to update contact"
        });
    }
});


/* DELETE CONTACT */
router.delete("/:id", async (req, res) => {
    try {
        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, req.params.id)
            .execute("sp_DeleteContact");

        res.status(200).json({
            message: "Contact deleted successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;