const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcrypt");

const { poolPromise } = require("../db");
const authMiddleware = require("../MiddleWare/authMiddleware");

const parseId = (val) => {
    const n = parseInt(val, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const toNull = (v) => (v === undefined || v === "" ? null : v);

const isAdmin = (req, res) => {
    if (req.user.role !== "Admin") {
        res.status(403).json({ message: "Access denied" });
        return false;
    }
    return true;
};

// CHECK PHONE (Public)
router.get("/check-phone/:phone", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("phone", sql.NVarChar(50), req.params.phone)
            .execute("sp_CheckUserPhone");

        res.json({ exists: result.recordset.length > 0 });
    } catch (error) {
        console.error("CHECK PHONE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET ALL USERS (Admin Only)
router.get("/", authMiddleware, async (req, res) => {
    if (!isAdmin(req, res)) return;

    try {
        const pool = await poolPromise;
        const result = await pool.request().execute("sp_GetAllUsers");
        res.json(result.recordset);
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// CREATE USER (Admin Only)
router.post("/", authMiddleware, async (req, res) => {
    if (!isAdmin(req, res)) return;

    try {
        const {
            name,
            email,
            password,
            role,
            employee_code,
            phone,
            department,
            designation,
            notes,
            is_active
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Name, email, password and role are required"
            });
        }

        const pool = await poolPromise;

        const existingUser = await pool.request()
            .input("email", sql.NVarChar(255), email)
            .execute("sp_CheckUserEmailForCreate");

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input("name", sql.NVarChar(255), name)
            .input("email", sql.NVarChar(255), email)
            .input("password_hash", sql.NVarChar(255), hashedPassword)
            .input("role", sql.NVarChar(50), role)
            .input("employee_code", sql.NVarChar(100), toNull(employee_code))
            .input("phone_number", sql.NVarChar(50), toNull(phone))
            .input("department", sql.NVarChar(100), toNull(department))
            .input("designation", sql.NVarChar(100), toNull(designation))
            .input("notes", sql.NVarChar(sql.MAX), toNull(notes))
            .input("is_active", sql.Bit, is_active === undefined ? 1 : !!is_active)
            .execute("sp_CreateUser");

        res.status(201).json({
            message: "User created successfully",
            user_id: result.recordset?.[0]?.user_id || null
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET USER BY ID (Admin Only)
router.get("/:id", authMiddleware, async (req, res) => {
    if (!isAdmin(req, res)) return;

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid user ID" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("UserId", sql.Int, id)
            .execute("sp_GetUserById");

        if (!result.recordset.length) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("GET USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE USER (Admin Only)
router.put("/:id", authMiddleware, async (req, res) => {
    if (!isAdmin(req, res)) return;

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid user ID" });

    try {
        const {
            name,
            email,
            role,
            employee_code,
            phone_number,
            department,
            designation,
            notes,
            is_active,
            password
        } = req.body;

        const pool = await poolPromise;

        const existingUser = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .input("UserId", sql.Int, id)
            .execute("sp_CheckUserEmailForUpdate");

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        await pool.request()
            .input("user_id", sql.Int, id)
            .input("name", sql.NVarChar(255), name)
            .input("email", sql.NVarChar(255), email)
            .input("role", sql.NVarChar(50), role)
            .input("employee_code", sql.NVarChar(100), toNull(employee_code))
            .input("phone_number", sql.NVarChar(50), toNull(phone_number))
            .input("department", sql.NVarChar(100), toNull(department))
            .input("designation", sql.NVarChar(100), toNull(designation))
            .input("notes", sql.NVarChar(sql.MAX), toNull(notes))
            .input("is_active", sql.Bit, is_active === undefined ? 1 : !!is_active)
            .input("password_hash", sql.NVarChar(255), hashedPassword)
            .execute("sp_UpdateUser");

        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("UPDATE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE USER (Admin Only)
router.delete("/:id", authMiddleware, async (req, res) => {
    if (!isAdmin(req, res)) return;

    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid user ID" });

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("UserId", sql.Int, id)
            .execute("sp_DeleteUser");

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;