import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { createUser,checkPhoneExists } from "../services/userService";
import AlertModal from "../components/AlertModal";

import "../css/addUser.css";

function AddUser() {

    const navigate = useNavigate();
    const [alertModal, setAlertModal] = useState(null);

    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Sales Representative",
        phone_number: "",
        employee_code: "",
        department: "",
        designation: "",
        is_active: true
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError("");
    };


    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!formData.email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!formData.password.trim()) {
            setError("Password is required.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (
            formData.phone_number &&
            !/^[0-9]{10}$/.test(formData.phone_number)
        ) {

            setError(
                "Phone number must be 10 digits."
            );

            return;

        }

        if (
            formData.employee_code &&
            formData.employee_code.length > 20
        ) {

            setError(
                "Employee code is too long."
            );

            return;

        }
        try {
            setLoading(true);
            // ✅ STEP 1: check phone
            if (formData.phone_number) {
                const phoneCheck = await checkPhoneExists(formData.phone_number);

                if (phoneCheck.exists) {
                    setError("Phone number already exists");
                    setLoading(false);
                    return;
                }
            }
            await createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                phone_number: formData.phone_number,
                employee_code: formData.employee_code,
                department: formData.department,
                designation: formData.designation,
                is_active: formData.is_active
            });
            showAlert("success", "User created", "User created Successfully!", () => {
                setAlertModal(null);
                navigate("/users");
            })

        } catch (err) {
            console.log("FULL ERROR:", err.response?.data);
            console.error(err);
            showAlert("error", "Failed", "Failed to create user")
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-user-layout">

            <Sidebar />

            <div className="add-user-container">

                <Topbar title="Add User" />

                <form className="user-form" onSubmit={handleSubmit}>


                    {error && <p className="error">{error}</p>}
                    <div className="form-grid">

                        <div className="form-group">
                            <label>Full Name <span className="imp">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email <span className="imp">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                required
                            />
                        </div>


                        <div className="form-group">
                            <label>Phone Number </label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label>Employee Code</label>
                            <input
                                type="text"
                                name="employee_code"
                                value={formData.employee_code}
                                onChange={handleChange}
                                placeholder="EMP001"
                            />
                        </div>

                        <div className="form-group">
                            <label>Department</label>

                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                            >
                                <option value="">Select Department</option>
                                <option value="Sales">Sales</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Support">Support</option>
                                <option value="Administration">Administration</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Designation</label>

                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="Senior Sales Executive"
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>

                            <select
                                name="is_active"
                                value={formData.is_active}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_active: e.target.value === "true"
                                    })
                                }
                            >
                                <option value={true}>Active</option>
                                <option value={false}>Inactive</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Role <span className="imp">*</span></label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Sales Manager">Sales Manager</option>
                                <option value="Sales Executive">Sales Executive</option>
                                <option value="Sales Representative">Sales Representative</option>
                            </select>
                        </div>

                        {/* PASSWORD */}
                        <div className="form-group full-width">
                            <label>Password <spna className="imp">*</spna></label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 6 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>


                        {/* CONFIRM PASSWORD */}
                        <div className="form-group full-width">
                            <label>Confirm Password <span className="imp">*</span></label>
                            <div className="input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>



                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => navigate("/users")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </form>

            </div>
            {alertModal && (
                <AlertModal
                    type={alertModal.type}
                    title={alertModal.title}
                    message={alertModal.message}
                    onClose={alertModal.onClose}
                />
            )}

        </div>
    );
}

export default AddUser;