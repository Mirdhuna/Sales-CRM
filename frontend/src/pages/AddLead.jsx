import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../css/AddEditLead.css";
import AlertModal from "../components/AlertModal";

import { createLead } from "../services/leadsService";

function AddLead() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);

    const [showMore, setShowMore] = useState(false);
    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        topic: "",
        account_id: "",
        primary_contact_id: "",
        rating: "",
        estimated_budget: "",
        currency: "USD",

        payment_terms: "",
        shipping_method: "",
        contact_method: "",
        order_type: "",
        purchase_timeframe: "",

        description: "",
        purchase_process: "",
        capture_summary: "",
        competitors: "",
        status: "New"
    });

    // ================= FETCH DROPDOWNS =================
    useEffect(() => {
        const loadData = async () => {
            try {
                const [accRes, conRes] = await Promise.all([
                    axios.get("http://localhost:5000/accounts"),
                    axios.get("http://localhost:5000/contacts")
                ]);

                setAccounts(accRes.data);
                setContacts(conRes.data);
            } catch (err) {
                console.error("Load error:", err);
            }
        };

        loadData();
    }, []);

    // ================= HANDLE CHANGE =================
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // ================= VALIDATION =================
    const validate = () => {
        if (!formData.topic) return "Topic is required";
        if (!formData.account_id) return "Account is required";
        if (!formData.primary_contact_id) return "Contact is required";
        return null;
    };

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };


    // ================= SUBMIT =================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validate();
        if (error) {
            showAlert("warning", "Missing Fields", error);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                account_id: Number(formData.account_id),
                primary_contact_id: Number(formData.primary_contact_id),
                estimated_budget: formData.estimated_budget
                    ? Number(formData.estimated_budget)
                    : 0
            };

            await createLead(payload);

            showAlert("success", "Lead created", "Lead created successfully!", () => {
                setAlertModal(null);
                navigate("/leads");
            });

        } catch (err) {
            console.error(err.response?.data || err.message);
            showAlert("error","Failed",err.response?.data?.error || "Failed to create lead");
        } finally {
            setLoading(false);
        }
    };

    // ================= DROPDOWN OPTIONS =================
    const currencyOptions = ["USD", "INR", "EUR", "GBP"];

    const shippingOptions = [
        "Airborne",
        "DHL",
        "FedEx",
        "UPS",
        "Postal Mail",
        "Full Load",
        "Will Call"
    ];

    const contactMethodOptions = [
        "Email",
        "Phone",
        "Fax",
        "Mail"
    ];

    const paymentTermsOptions = ["Net 25", "Net 50", "Net 75", "Net 100"];

    const orderTypeOptions = [
        "Item Based",
        "Service-Maintenance Based"
    ];

    const purchaseTimeframeOptions = [
        "Immediate",
        "This Quarter",
        "Next Quarter",
        "This Year",
        "Unknown"
    ];

    return (
        <div className="leads-layout">
            <Sidebar />

            <div className="leads-container">
                <Topbar title="Add Lead" />

                <form className="lead-form" onSubmit={handleSubmit}>

                    {/* ================= BASIC INFO ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Basic Information
                        </div>

                        <div className="grid">
                            <div className="form-filed">
                                <label>Topic <span className="imp">*</span></label>
                                <input
                                    name="topic"
                                    placeholder="Enter Lead Topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-filed">
                                <label>Account <span className="imp">*</span></label>
                                <select
                                    name="account_id"
                                    value={formData.account_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(a => (
                                        <option key={a.account_id} value={a.account_id}>
                                            {a.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Primary Contact <span className="imp">*</span></label>
                                <select
                                    name="primary_contact_id"
                                    value={formData.primary_contact_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Contact</option>
                                    {contacts.map(c => (
                                        <option key={c.contact_id} value={c.contact_id}>
                                            {c.first_name} {c.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Budget</label>
                                <input
                                    name="estimated_budget"
                                    type="number"
                                    placeholder="Enter Budget"
                                    value={formData.estimated_budget}
                                    onChange={handleChange}
                                />
                            </div>
                            {/* Currency dropdown */}

                            <div className="form-filed">
                                <label>Currency</label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                >
                                    {currencyOptions.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Rating</label>
                                <select
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Rating</option>
                                    <option value="Hot">Hot</option>
                                    <option value="Warm">Warm</option>
                                    <option value="Cold">Cold</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* ================= ADVANCED ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Purchase & Communication
                        </div>

                        <div className="grid">

                            {/* Payment Terms */}
                            <div className="form-filed">
                                <label>Payment Terms</label>
                                <select
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Payment Terms</option>
                                    {paymentTermsOptions.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Shipping Method */}
                            <div className="form-filed">
                                <label>Shipping Method</label>
                                <select
                                    name="shipping_method"
                                    value={formData.shipping_method}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Shipping Method</option>
                                    {shippingOptions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Contact Method */}
                            <div className="form-filed">
                                <label>Contact Method</label>
                                <select
                                    name="contact_method"
                                    value={formData.contact_method}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Contact Method</option>
                                    {contactMethodOptions.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Order Type */}
                            <div className="form-filed">
                                <label>Order Type</label>
                                <select
                                    name="order_type"
                                    value={formData.order_type}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Order Type</option>
                                    {orderTypeOptions.map(o => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Purchase Timeframe</label>
                                <select
                                    name="purchase_timeframe"
                                    value={formData.purchase_timeframe}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Purchase Timeframe</option>
                                    {purchaseTimeframeOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* ================= DETAILS ================= */}
                    <div className="form-section">
                        <div className="form-section-title">
                            Additional Details
                        </div>

                        <div className="grid">
                            <div className="form-filed">
                                <label>Purchase Process</label>
                                <select
                                    name="purchase_process"
                                    value={formData.purchase_process}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Purchase Process</option>
                                    <option value="Unknown">Unknown</option>
                                    <option value="Committee">Committee</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter Description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-filed">
                                <label>Summary</label>
                                <textarea
                                    name="capture_summary"
                                    placeholder="Enter Summary"
                                    value={formData.capture_summary}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-filed">
                                <label>Competitors</label>
                                <textarea
                                    name="competitors"
                                    placeholder="Enter Competitors"
                                    value={formData.competitors}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>
                    </div>

                    {/* ================= BUTTONS ================= */}
                    <div className="form-buttons">

                        <button type="button" className="cancel-btn" onClick={() => navigate("/leads")}>
                            Cancel
                        </button>

                        <button type="submit" className="submit-btn " disabled={loading}>
                            {loading ? "Saving..." : "Submit"}
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

export default AddLead;