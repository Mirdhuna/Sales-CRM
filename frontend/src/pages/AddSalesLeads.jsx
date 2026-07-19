import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AlertModal from "../components/AlertModal";
import "../css/AddEditSalesLead.css";
import { useNavigate } from "react-router-dom";
import { addSalesLead } from "../services/SalesLeads";

function AddSalesLead() {
    const navigate = useNavigate();

    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        topic: "",
        company_name: "",
        industry: "",
        company_phone: "",
        company_website: "",
        street: "",
        city: "",
        state_province: "",
        zip_postal_code: "",
        country_region: "",
        first_name: "",
        last_name: "",
        email: "",
        job_title: "",
        phone: "",
        fax: "",
        gender: "",
        currency: "INR",
        payment_terms: "",
        shipping_method: "",
        contact_method: "",
        rating: "",
        order_type: "",
        purchase_timeframe: "",
        estimated_budget: "",
        purchase_process: "",
        description: "",
        capture_summary: "",
        status: "Active",
        competitors: []
    });

    /* ─────────────── Helpers ─────────────── */
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* ─────────────── Validation ─────────────── */
    const validateForm = () => {
        const errors = [];

        if (!formData.company_name.trim()) errors.push("Company Name is required");
        if (!formData.first_name.trim()) errors.push("First Name is required");
        if (!formData.last_name.trim()) errors.push("Last Name is required");
        if (!formData.email.trim()) errors.push("Email is required");
        if (!formData.phone.trim()) errors.push("Phone is required");
        if (!formData.topic.trim()) errors.push("Topic is required");
        if (!/^\d{10}$/.test(formData.phone)) {
            errors.push("Phone number must be exactly 10 digits");
        }
        if (
            formData.company_phone &&
            !/^\d{10}$/.test(formData.company_phone)
        ) {
            errors.push("Company Phone must be exactly 10 digits");
        }

        return errors;
    };



    /* ─────────────── Submit ─────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            showAlert("warning", "Missing Fields", errors.join("\n"));
            return;
        }

        try {
            await addSalesLead(formData);
            showAlert("success", "Lead Added", "Sales lead has been added successfully.", () => {
                setAlertModal(null);
                navigate("/salesLeads");
            });
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to add sales lead. Please try again.");
        }
    };

    /* ─────────────── Render ─────────────── */
    return (
        <div className="salesLead-layout">
            <Sidebar />
            <div className="salesLead-container">
                <Topbar title="Add Sales Lead" />

                {/* ══════════════════════════════════════
                    COMPANY INFO
                ══════════════════════════════════════ */}
                <div className="salesLead-grid">
                    <h3>Company Info</h3>

                    <div className="group">
                        <label>Company Name <span className="imp">*</span></label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Enter Company Name"
                        />
                    </div>

                    <div className="group">
                        <label>Industry</label>
                        <select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                        >
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Research">Research</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Company Phone</label>
                        <input
                            type="tel"
                            name="company_phone"
                            value={formData.company_phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // allow only digits
                                if (value.length <= 10) {
                                    setFormData(prev => ({ ...prev, phone: value }));
                                }
                            }}
                            maxLength={10}
                            placeholder="Enter Company Phone"
                        />
                    </div>

                    <div className="group">
                        <label>Company Website</label>
                        <input
                            type="url"
                            name="company_website"
                            value={formData.company_website}
                            onChange={handleChange}
                            placeholder="Enter Company Website"
                        />
                    </div>

                    <div className="group">
                        <label>Street</label>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            placeholder="Enter Street"
                        />
                    </div>

                    <div className="group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter City"
                        />
                    </div>

                    <div className="group">
                        <label>State / Province</label>
                        <input
                            type="text"
                            name="state_province"
                            value={formData.state_province}
                            onChange={handleChange}
                            placeholder="Enter State / Province"
                        />
                    </div>

                    <div className="group">
                        <label>Zip Code</label>
                        <input
                            name="zip_postal_code"
                            value={formData.zip_postal_code}
                            onChange={handleChange}
                            placeholder="Enter Zip Code"
                        />
                    </div>

                    <div className="group">
                        <label>Country / Region</label>
                        <input
                            name="country_region"
                            value={formData.country_region}
                            onChange={handleChange}
                            placeholder="Enter Country / Region"
                        />
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    CONTACT INFO
                ══════════════════════════════════════ */}
                <div className="salesLead-grid">
                    <h3>Contact Info</h3>

                    <div className="group">
                        <label>First Name <span className="imp">*</span></label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Enter First Name"
                        />
                    </div>

                    <div className="group">
                        <label>Last Name <span className="imp">*</span></label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Enter Last Name"
                        />
                    </div>

                    <div className="group">
                        <label>Email <span className="imp">*</span></label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter Email"
                        />
                    </div>

                    <div className="group">
                        <label>Phone <span className="imp">*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // allow only digits
                                if (value.length <= 10) {
                                    setFormData(prev => ({ ...prev, phone: value }));
                                }
                            }}
                            maxLength={10}
                            placeholder="Enter Phone"
                        />
                    </div>

                    <div className="group">
                        <label>Job Title</label>
                        <input
                            type="text"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleChange}
                            placeholder="Enter Job Title"
                        />
                    </div>

                    <div className="group">
                        <label>Fax</label>
                        <input
                            name="fax"
                            value={formData.fax}
                            onChange={handleChange}
                            placeholder="Enter Fax"
                        />
                    </div>

                    <div className="group">
                        <label>Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Others</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Contact Method</label>
                        <select
                            name="contact_method"
                            value={formData.contact_method}
                            onChange={handleChange}
                        >
                            <option value="">Select Contact Method</option>
                            <option value="Phone">Phone</option>
                            <option value="Email">Email</option>
                            <option value="Fax">Fax</option>
                            <option value="Mail">Mail</option>
                        </select>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    LEAD INFO
                ══════════════════════════════════════ */}
                <div className="salesLead-grid">
                    <h3>Lead Info</h3>

                    <div className="group">
                        <label>Topic <span className="imp">*</span></label>
                        <input
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            placeholder="Enter Topic"
                        />
                    </div>

                    <div className="group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Disqualified">Disqualified</option>
                        </select>
                    </div>

                    <div className="group">
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

                    <div className="group">
                        <label>Purchase Timeframe</label>
                        <select
                            name="purchase_timeframe"
                            value={formData.purchase_timeframe}
                            onChange={handleChange}
                        >
                            <option value="">Select Purchase Timeframe</option>
                            <option value="Immediate">Immediate</option>
                            <option value="This Quarter">This Quarter</option>
                            <option value="Next Quarter">Next Quarter</option>
                            <option value="This Year">This Year</option>
                            <option value="Unknown">Unknown</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Estimated Budget</label>
                        <input
                            type="number"
                            min="0"
                            name="estimated_budget"
                            value={formData.estimated_budget}
                            onChange={handleChange}
                            placeholder="Enter Estimated Budget"
                        />
                    </div>

                    <div className="group">
                        <label>Currency</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                        >
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                            <option value="SGD">SGD</option>
                            <option value="JPY">JPY</option>
                            <option value="VND">VND</option>
                            <option value="MYR">MYR</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Order Type</label>
                        <select
                            name="order_type"
                            value={formData.order_type}
                            onChange={handleChange}
                        >
                            <option value="">Select Order Type</option>
                            <option value="Item Based">Item Based</option>
                            <option value="Service-Maintenance Based">Service-Maintenance Based</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Purchase Process</label>
                        <select
                            name="purchase_process"
                            value={formData.purchase_process}
                            onChange={handleChange}
                        >
                            <option value="">Select Purchase Process</option>
                            <option value="Individual">Individual</option>
                            <option value="Committee">Committee</option>
                            <option value="Unknown">Unknown</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Payment Terms</label>
                        <select
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleChange}
                        >
                            <option value="">Select Payment Terms</option>
                            <option value="Net 25">Net 25</option>
                            <option value="Net 50">Net 50</option>
                            <option value="Net 75">Net 75</option>
                            <option value="Net 100">Net 100</option>
                        </select>
                    </div>

                    <div className="group">
                        <label>Shipping Method</label>
                        <select
                            name="shipping_method"
                            value={formData.shipping_method}
                            onChange={handleChange}
                        >
                            <option value="">Select Shipping Method</option>
                            <option value="Airborne">Airborne</option>
                            <option value="DHL">DHL</option>
                            <option value="FedEx">FedEx</option>
                            <option value="UPS">UPS</option>
                            <option value="Postal Mail">Postal Mail</option>
                            <option value="Full Load">Full Load</option>
                            <option value="Will Call">Will Call</option>
                        </select>
                    </div>

                    <div className="group full-width">
                        <label>Description</label>
                        <textarea
                            rows="4"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter Description"
                        />
                    </div>

                    <div className="group full-width">
                        <label>Capture Summary</label>
                        <textarea
                            rows="4"
                            name="capture_summary"
                            value={formData.capture_summary}
                            onChange={handleChange}
                            placeholder="Enter Capture Summary"
                        />
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    FORM ACTIONS
                ══════════════════════════════════════ */}
                <div className="salesLead-actions">

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => navigate("/salesLeads")}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="lead-save-btn"
                        onClick={handleSubmit}
                    >
                        Save Lead
                    </button>

                </div>

            </div>

            {/* ══════════════════════════════════════
                ALERT MODAL
            ══════════════════════════════════════ */}
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

export default AddSalesLead;