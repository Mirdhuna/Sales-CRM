import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../css/AddEditLead.css";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";

function EditLead() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

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
    const handleQualify = () => {
        setConfirmModal({
            title: "Qualify Lead?",
            message: "Are you sure you want to qualify this lead? An opportunity will be created.",
            confirmText: "Qualify",
            confirmClass: "confirm-modal-won-btn",
            icon: "paid",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    setLoading(true);

                    await axios.put(`http://localhost:5000/leads/${id}`, {
                        ...formData,
                        status: "Qualified",
                        account_id: Number(formData.account_id),
                        primary_contact_id: Number(formData.primary_contact_id),
                        estimated_budget: formData.estimated_budget
                            ? Number(formData.estimated_budget)
                            : 0
                    });

                    await axios.post("http://localhost:5000/opportunities", {
                        topic: formData.topic,
                        account_id: Number(formData.account_id),
                        primary_contact_id: Number(formData.primary_contact_id),
                        budget_amount: Number(formData.estimated_budget || 0),
                        purchase_timeframe: formData.purchase_timeframe || "Unknown",
                        purchase_process: formData.purchase_process || "Unknown",
                        currency: formData.currency,
                        description: formData.description,
                        customer_need: "",
                        proposed_solution: "",
                        status: "New"
                    });

                    showAlert("success", "Lead Qualified", "Lead qualified successfully.\nOpportunity created successfully.", () => {
                        setAlertModal(null);
                        navigate("/opportunities");
                    });

                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", err.response?.data?.error || "Failed to qualify lead.");
                } finally {
                    setLoading(false);
                }
            }
        });
    };
    const handleDisqualify = () => {
        setConfirmModal({
            title: "Disqualify Lead?",
            message: "Are you sure you want to disqualify this lead? This action cannot be undone.",
            confirmText: "Disqualify",
            confirmClass: "confirm-modal-delete-btn",
            icon: "close",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    setLoading(true);

                    await axios.put(`http://localhost:5000/leads/${id}`, {
                        ...formData,
                        status: "Disqualified",
                        account_id: Number(formData.account_id),
                        primary_contact_id: Number(formData.primary_contact_id),
                        estimated_budget: formData.estimated_budget
                            ? Number(formData.estimated_budget)
                            : 0
                    });

                    showAlert("success", "Lead Disqualified", "Lead disqualified successfully.", () => {
                        setAlertModal(null);
                        navigate("/leads");
                    });

                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", err.response?.data?.error || "Failed to disqualify lead.");
                } finally {
                    setLoading(false);
                }
            }
        });
    };


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
                console.error("Dropdown load error:", err);
            }
        };

        loadData();
    }, []);

    // ================= FETCH LEAD BY ID =================
    useEffect(() => {
        const loadLead = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/leads/${id}`);
                const data = res.data;

                setFormData({
                    topic: data.topic || "",
                    account_id: data.account_id || "",
                    primary_contact_id: data.primary_contact_id || "",
                    rating: data.rating || "",
                    estimated_budget: data.estimated_budget || "",
                    currency: data.currency || "USD",

                    payment_terms: data.payment_terms || "",
                    shipping_method: data.shipping_method || "",
                    contact_method: data.contact_method || "",
                    order_type: data.order_type || "",
                    purchase_timeframe: data.purchase_timeframe || "",

                    description: data.description || "",
                    purchase_process: data.purchase_process || "",
                    capture_summary: data.capture_summary || "",
                    competitors: data.competitors || "",
                    status: data.status || "New"
                });

            } catch (err) {
                console.error("Lead load error:", err);
            }
        };

        loadLead();
    }, [id]);

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

    // ================= UPDATE =================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validate();
        if (error) {
            showAlert("warning", "Missing Field", error);
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

            await axios.put(`http://localhost:5000/leads/${id}`, payload);

            showAlert("success", "Lead updated", "Lead updated successfully!", () => {
                setAlertModal(null);
                navigate("/leads");
            });

        } catch (err) {
            console.error(err.response?.data || err.message);
            showAlert("error", "Failed", err.response?.data?.error || "Failed to update lead");
        } finally {
            setLoading(false);
        }
    };

    // ================= OPTIONS =================
    const currencyOptions = ["USD", "INR", "EUR", "GBP"];

    const shippingOptions = ["Airborne", "DHL", "FedEx", "UPS", "Postal Mail", "Full Load", "Will Call"];

    const contactMethodOptions = ["Email", "Phone", "Fax", "Mail"];

    const paymentTermsOptions = ["Net 25", "Net 50", "Net 75", "Net 100"];

    const orderTypeOptions = ["Item Based", "Service-Maintenance Based"];

    const purchaseTimeframeOptions = ["Immediate", "This Quarter", "Next Quarter", "This Year", "Unknown"];

    return (
        <div className="leads-layout">
            <Sidebar />

            <div className="leads-container">
                <Topbar title="Edit Lead" />

                <form className="lead-form" onSubmit={handleSubmit}>

                    {/* BASIC INFO */}
                    <div className="form-section">
                        <div className="form-section-title">Basic Information</div>

                        <div className="grid">
                            <div className="form-filed">
                                <label>Topic <span className="imp">*</span></label>
                                <input
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    placeholder="Enter Lead Topic"
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
                                <label>Primary Contact<span className="imp">*</span></label>
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
                                    value={formData.estimated_budget}
                                    onChange={handleChange}
                                    placeholder="Enter Budget"
                                />
                            </div>

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
                                    <option value="Hot" id="hot">Hot</option>
                                    <option value="Warm" id="warm">Warm</option>
                                    <option value="Cold" id="cold">Cold</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ADVANCED */}
                    <div className="form-section">
                        <div className="form-section-title">Purchase & Communication</div>

                        <div className="grid">

                            <div className="form-filed">
                                <label>Payment Terms</label>
                                <select name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
                                    <option value="">Select Payment Terms</option>
                                    {paymentTermsOptions.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Shipping Method</label>
                                <select name="shipping_method" value={formData.shipping_method} onChange={handleChange}>
                                    <option value="">Select Shipping Method</option>
                                    {shippingOptions.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Contact Method</label>
                                <select name="contact_method" value={formData.contact_method} onChange={handleChange}>
                                    <option value="">Select Contact Method</option>
                                    {contactMethodOptions.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Order Type</label>
                                <select name="order_type" value={formData.order_type} onChange={handleChange}>
                                    <option value="">Select Order Type</option>
                                    {orderTypeOptions.map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>

                            <div className="form-filed">
                                <label>Purchase Timeframe</label>
                                <select name="purchase_timeframe" value={formData.purchase_timeframe} onChange={handleChange}>
                                    <option value="">Select Purchase Timeframe</option>
                                    {purchaseTimeframeOptions.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="form-section">
                        <div className="form-section-title">Additional Details</div>

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
                                <textarea name="description" value={formData.description} placeholder="Enter Description" onChange={handleChange} />
                            </div>

                            <div className="form-filed">
                                <label>Summary</label>
                                <textarea name="capture_summary" value={formData.capture_summary} placeholder="Enter Summary" onChange={handleChange} />
                            </div>

                            <div className="form-filed">
                                <label>Competitors</label>
                                <textarea name="competitors" value={formData.competitors} placeholder="Enter Competitors" onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* BUTTONS */}

                    <div className="form-buttons">

                        <div className="left-buttons">
                            <button
                                type="button"
                                className="Qf"
                                onClick={handleQualify}
                            >
                                Qualify
                            </button>

                            <button
                                type="button"
                                className="Df"
                                onClick={handleDisqualify}
                            >
                                Disqualify
                            </button>
                        </div>

                        <div className="right-buttons">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => navigate("/leads")}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Lead"}
                            </button>
                        </div>

                    </div>
                </form>
            </div >
            {alertModal && (
                <AlertModal
                    type={alertModal.type}
                    title={alertModal.title}
                    message={alertModal.message}
                    onClose={alertModal.onClose}
                />
            )}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    confirmClass={confirmModal.confirmClass}
                    icon={confirmModal.icon}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}
        </div >
    );
}

export default EditLead;