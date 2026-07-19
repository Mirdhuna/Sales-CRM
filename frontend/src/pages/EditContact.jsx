import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../css/AddEditContact.css";

import AlertModal from "../components/AlertModal";

import { updateContact, getContactById } from "../services/contactsService";

function EditContact() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(false);

    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        job_title: "",
        phone: "",
        fax: "",
        gender: "",
        address: "",
        contact_method: "",
        description: "",
        account_id: ""
    });

    useEffect(() => {
        loadContact();
    }, [id]);

    const loadContact = async () => {
        try {
            const data = await getContactById(id);

            setFormData({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                email: data.email || "",
                job_title: data.job_title || "",
                phone: data.phone || "",
                fax: data.fax || "",
                gender: data.gender || "",
                address: data.address || "",
                contact_method: data.contact_method || "",
                description: data.description || "",
                account_id: data.account_id || ""
            });

        } catch (error) {
            console.error("Failed to load contact", error);
        }
    };
    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // VALIDATION
    const validate = () => {
        if (!formData.first_name.trim())
            return "First name is required";

        if (!formData.last_name.trim())
            return "Last name is required";

        if (!formData.gender)
            return "Gender is required";

        if (!formData.email.trim())
            return "Email is required";

        if (!/\S+@\S+\.\S+/.test(formData.email))
            return "Invalid email";

        if (!formData.phone)
            return "Phone number is required";

        if (!/^\d{10}$/.test(formData.phone))
            return "Phone number must be exactly 10 digits";

        return null;
    };
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    // UPDATE CONTACT
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validate();

        if (error) {
            showAlert("warning", "Missing Fields", error);
            return;
        }

        setLoading(true);
        console.log(formData);
        try {

            await updateContact(id, {
                ...formData,
                account_id: formData.account_id
                    ? parseInt(formData.account_id)
                    : null
            });

            showAlert("success", "Contact updated", "Contact updated successfully!", () => {
                setAlertModal(null);
                navigate("/contacts");
            });

        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to update contact");

        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="contact-form-layout">
            <Sidebar />

            <div className="contact-form-card">
                <Topbar title="Edit Contact" />

                <form onSubmit={handleSubmit}>

                    {/* ================= PERSONAL INFO ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Personal Info
                        </div>

                        <div className="form-grid">

                            <div className="form-field">
                                <label>First Name <span className="imp">*</span></label>
                                <input
                                    name="first_name"
                                    placeholder="Enter First Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Last Name <span className="imp">*</span></label>
                                <input
                                    name="last_name"
                                    placeholder="Enter Last Name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Email <span className="imp">*</span></label>
                                <input
                                    name="email"
                                    placeholder="Enter Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Phone</label>
                                <input
                                    name="phone"
                                    placeholder="Enter Phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        if (value.length <= 10) {
                                            setFormData({
                                                ...formData,
                                                phone: value
                                            });
                                        }
                                    }}
                                    maxLength={10}
                                />
                            </div>

                            <div className="form-field">
                                <label>Fax</label>
                                <input
                                    name="fax"
                                    placeholder="Enter Fax"
                                    value={formData.fax}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Gender <span className="imp">*</span></label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* ================= WORK INFO ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Work Info
                        </div>

                        <div className="form-grid">

                            <div className="form-field">
                                <label>Job Title</label>
                                <input
                                    name="job_title"
                                    placeholder="Enter Job Title"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-field">
                                <label>Account ID</label>
                                <input
                                    name="account_id"
                                    placeholder="Enter Account ID"
                                    value={formData.account_id}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>
                    </div>

                    {/* ================= ADDRESS ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Address
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    placeholder="Enter Address"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ================= CRM DETAILS ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            CRM Details
                        </div>

                        <div className="form-grid">

                            <div className="form-field">
                                <label>Contact Method</label>
                                <select
                                    name="contact_method"
                                    value={formData.contact_method}
                                    onChange={handleChange}
                                >
                                    <option value="Email">Email</option>
                                    <option value="Phone">Phone</option>
                                    <option value="Fax">Fax</option>
                                    <option value="Mail">Mail</option>
                                </select>
                            </div>

                            <div className="form-field full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter Description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>
                    </div>

                    {/* ================= BUTTONS ================= */}
                    <div className="form-buttons">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/contacts")}
                        >
                            Cancel
                        </button>

                        <button type="submit" disabled={loading} className="cont-save-btn">
                            {loading ? "Updating..." : "Update Contact"}
                        </button>
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

export default EditContact;