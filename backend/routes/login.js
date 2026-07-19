const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { poolPromise } = require("../db");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .query("SELECT * FROM users WHERE email = @email");

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // Reject deactivated accounts
        if (!user.is_active) {
            return res.status(403).json({
                message: "Your account has been deactivated. Contact your Admin."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        await pool.request()
            .input("userId", sql.Int, user.user_id)
            .query(`
                UPDATE users
                SET last_login = SYSDATETIMEOFFSET()
                WHERE user_id = @userId
            `);

        res.json({
            message: "Login successful",
            token,
            user: {
                userId: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// NOTE: /register route intentionally removed.
// Users are created only by Admins via POST /users.
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const pool = await poolPromise;

    const userResult = await pool.request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM users WHERE email = @email");

    const user = userResult.recordset[0];

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await pool.request()
        .input("email", sql.VarChar, email)
        .input("token", sql.VarChar, token)
        .input("expiry", sql.DateTime, expiry)
        .query(`
      UPDATE users
      SET reset_token = @token,
          reset_token_expiry = @expiry
      WHERE email = @email
    `);

    // TODO: send email (nodemailer)
    console.log("Reset link:", `http://localhost:3000/reset-password?token=${token}`);

    res.json({ message: "Reset link sent to email" });
});

router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
        .input("token", sql.VarChar, token)
        .query(`
      SELECT * FROM users
      WHERE reset_token = @token
      AND reset_token_expiry > GETDATE()
    `);

    const user = result.recordset[0];

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
        .input("token", sql.VarChar, token)
        .input("password", sql.VarChar, hashedPassword)
        .query(`
      UPDATE users
      SET password_hash = @password,
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE reset_token = @token
    `);

    res.json({ message: "Password reset successful" });
});

module.exports = router;