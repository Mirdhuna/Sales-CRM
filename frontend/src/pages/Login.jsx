import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaGoogle,
    FaUsers,
    FaHandshake,
    FaChartLine
} from "react-icons/fa";

import { login } from "../services/loginService";
import pic1 from "../assets/pic1.png"
// Import your illustration image here
// import loginIllustration from "../assets/login-illustration.png";

import "../css/Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            setError("Email address is required.");
            return;
        }

        if (!formData.password.trim()) {
            setError("Password is required.");
            return;
        }

        try {
            setLoading(true);

            const response = await login({
                email: formData.email,
                password: formData.password
            });

            localStorage.setItem("token", response.token);

            // FIX: response.user is now returned by the fixed login.js
            localStorage.setItem("user", JSON.stringify(response.user));

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Invalid email or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* LEFT SECTION */}
            <div className="login-left">

                <div className="login-logo">
                    <div className="logo-box">
                        <span>◆</span>
                    </div>

                    <h1>Sales CRM</h1>
                </div>

                <div className="login-content">
                    <h2>
                        Grow Your Business
                        <br />
                        Stronger with <span>Sales CRM</span>
                    </h2>

                    <p>
                        Manage leads, build relationships, close deals,
                        and grow your business — all in one place.
                    </p>
                    <br></br>
                    <div className="illustration-container">

                        <div className="illustration-placeholder">
                            <img
                            src={pic1}
                            alt="CRM Dashboard"
                            className="login-illustration"
                        />
                        
                        </div>

                    </div>
                    <br></br>

                    <div className="features">

                        <div className="feature-item">
                            <div className="feature-icon">
                                <FaUsers />
                            </div>

                            <h4>Manage Leads</h4>

                            <p>
                                Capture and manage
                                high-quality leads.
                            </p>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">
                                <FaHandshake />
                            </div>

                            <h4>Build Relationships</h4>

                            <p>
                                Strengthen customer
                                relationships.
                            </p>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">
                                <FaChartLine />
                            </div>

                            <h4>Close Deals</h4>

                            <p>
                                Track opportunities
                                and close more deals.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="login-footer">
                    © 2026 Sales CRM. All rights reserved.
                </div>

            </div>

            {/* RIGHT SECTION */}
            <div className="login-right">

                <div className="login-card">

                    <div className="login-header">
                        <h2>Welcome Back!</h2>

                        <p>
                            Sign in to continue to Sales CRM
                        </p>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        {/* EMAIL */}
                        <div className="form-group">

                            <label>Email Address</label>

                            <div className="input-wrapper-log">

                                <FaEnvelope className="input-icon" />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    
                                />

                            </div>

                        </div>

                        {/* PASSWORD */}
                        <div className="form-group">

                            <label>Password</label>

                            <div className="input-wrapper-log">

                                <FaLock className="input-icon" />

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >
                                    {showPassword
                                        ? <FaEyeSlash />
                                        : <FaEye />}
                                </button>

                            </div>

                        </div>

                        {/* OPTIONS */}
                        <div className="login-options">

                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />

                                Remember me

                            </label>

                            <button
                                type="button"
                                onClick={()=>navigate("/forgot-password")}
                                className="forgot-password"
                            >
                                Forgot Password?
                            </button>

                        </div>

                        {/* LOGIN BUTTON */}
                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>

                    </form>

                    {/* DIVIDER */}
                    <div className="divider">
                        <span>or</span>
                    </div>

                    {/* GOOGLE LOGIN (UI ONLY) */}
                    <button
                        type="button"
                        className="google-btn"
                    >
                        <FaGoogle />
                        Sign in with Google
                    </button>

                    {/* SIGN UP 
                    <div className="signup-text">

                        Don't have an account?{" "}

                        {/* FIX: was "/users" (the users list page) — should be "/users/add" 
                        <Link to="/users">
                            Sign up
                        </Link>

                    </div>*/}

                </div>

            </div>

        </div>
    );
}

export default Login;