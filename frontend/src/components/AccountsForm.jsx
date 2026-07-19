import React, { useState, useEffect } from "react";
import "../css/AccountsForm.css";
import { useNavigate } from "react-router-dom";

function AccountForm({
    formData,
    handleChange,
    handleSubmit,
    buttonText
}) {
    const [contacts, setContacts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://localhost:5000/contacts")
            .then(res => res.json())
            .then(data => {
                console.log("Contacts:", data);
                setContacts(data);
            })
            .catch(err => console.error("Failed to load contacts", err));
    }, []);

    const validateForm = () => {
        const errors = [];

        if (!formData.account_name.trim())
            errors.push("Account Name is required");

        if (!formData.industry)
            errors.push("Industry is required");

        if (!formData.phone)
            errors.push("Phone is required");

        if (!formData.currency)
            errors.push("Currency is required");

        if (!formData.payment_terms)
            errors.push("Payment Terms is required");

        if (!formData.shipping_method)
            errors.push("Shipping Method is required");

        if (!formData.contact_method)
            errors.push("Contact Method is required");

        if (!/^\d{10}$/.test(formData.phone))
            errors.push("Phone number must be exactly 10 digits");

        if (
            formData.website &&
            !/^https?:\/\/.+\..+/.test(formData.website)
        ) {
            errors.push("Please enter a valid website URL");
        }

        if (
            formData.annual_revenue &&
            Number(formData.annual_revenue) < 0
        ) {
            errors.push("Annual Revenue cannot be negative");
        }

        if (
            formData.zip_postal_code &&
            !/^\d{6}$/.test(formData.zip_postal_code)
        ) {
            errors.push("ZIP Code must be 6 digits");
        }

        return errors;
    };
    return (
        <form className="account-form" onSubmit={handleSubmit}>

            {/* ================= ACCOUNT INFORMATION ================= */}
            <div className="account-form-section">

                <h3>Account Information</h3>

                <div className="account-form-grid">

                    {/* Account ID */}
                    <div className="account-form-group">
                        <label>Account ID</label>
                        <input
                            type="text"
                            value={formData.account_id || "Auto Generated"}
                            disabled
                        />
                    </div>

                    {/* Account Name */}
                    <div className="account-form-group">
                        <label>
                            Account Name <span>*</span>
                        </label>
                        <input
                            type="text"
                            name="account_name"
                            placeholder="Enter account name"
                            value={formData.account_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Industry */}
                    <div className="account-form-group">
                        <label>Industry <span>*</span></label>
                        <select name="industry" value={formData.industry} onChange={handleChange}>
                            <option value="">Select industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Research">Research</option>
                        </select>
                    </div>

                    {/* Phone */}
                    <div className="account-form-group">
                        <label>Phone <span>*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            required
                        />
                    </div>

                    {/* Fax */}
                    <div className="account-form-group">
                        <label>Fax </label>
                        <input
                            type="tel"
                            name="fax"
                            placeholder="Enter fax number"
                            value={formData.fax}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Website */}
                    <div className="account-form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            name="website"
                            placeholder="Enter website"
                            value={formData.website}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Currency */}
                    <div className="account-form-group">
                        <label>Currency <span>*</span></label>
                        <select name="currency" value={formData.currency} onChange={handleChange}>
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                            <option value="SGD">SGD</option>
                            <option value="JPY">JPY</option>
                            <option value="VND">VND</option>
                            <option value="MYR">MYR</option>
                        </select>
                    </div>

                    {/* Annual Revenue */}
                    <div className="account-form-group">
                        <label>Annual Revenue</label>
                        <input
                            type="number"
                            name="annual_revenue"
                            placeholder="Enter annual revenue"
                            value={formData.annual_revenue}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Payment Terms */}
                    <div className="account-form-group">
                        <label>Payment Terms <span>*</span></label>
                        <select
                            name="payment_terms"
                            value={formData.payment_terms}
                            onChange={handleChange}
                        >
                            <option value="">Select payment terms</option>
                            <option value="Net 25">Net 25</option>
                            <option value="Net 50">Net 50</option>
                            <option value="Net 75">Net 75</option>
                            <option value="Net 100">Net 100</option>
                        </select>
                    </div>

                    {/* Shipping Method */}
                    <div className="account-form-group">
                        <label>Shipping Method <span>*</span></label>
                        <select
                            name="shipping_method"
                            value={formData.shipping_method}
                            onChange={handleChange}
                        >
                            <option value="">Select shipping method</option>
                            <option value="Airborne">Airborne</option>
                            <option value="DHL">DHL</option>
                            <option value="FedEx">FedEx</option>
                            <option value="UPS">UPS</option>
                            <option value="Postal Mail">Postal Mail</option>
                            <option value="Full Load">Full Load</option>
                            <option value="Will Call">Will Call</option>
                        </select>
                    </div>

                    {/* Contact Method */}
                    <div className="account-form-group">
                        <label>Contact Method <span>*</span></label>
                        <select
                            name="contact_method"
                            value={formData.contact_method}
                            onChange={handleChange}
                        >
                            <option value="">Select contact method</option>
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                            <option value="Fax">Fax</option>
                            <option value="Mail">Mail</option>
                        </select>
                    </div>

                    {/* Primary Contact */}
                    <div className="account-form-group">
                        <label>Primary Contact</label>
                        <select
                            name="primary_contact_id"
                            value={formData.primary_contact_id}
                            onChange={handleChange}
                        >
                            <option value="">-- Select Contact --</option>
                            {contacts.map((contact) => (
                                <option key={contact.contact_id} value={contact.contact_id}>
                                    {contact.first_name} {contact.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Description */}
                <div className="account-form-group account-full-width">
                    <br />
                    <label>Description</label>
                    <textarea
                        name="description"
                        placeholder="Enter description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>

            </div>

            {/* ================= ADDRESS INFORMATION ================= */}
            <div className="account-form-section">

                <h3>Address Information</h3>

                <div className="account-form-grid">

                    <div className="account-form-group account-full-width">
                        <label>Street</label>
                        <input
                            type="text"
                            name="street"
                            placeholder="Enter street address"
                            value={formData.street}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="account-form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            placeholder="Enter City"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="account-form-group">
                        <label>State / Province</label>
                        <input
                            type="text"
                            name="state_province"
                            placeholder="Enter State / Province"
                            value={formData.state_province}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="account-form-group">
                        <label>ZIP / Postal Code</label>
                        <input
                            type="text"
                            name="zip_postal_code"
                            placeholder="Enter Zip / Postal Code"
                            value={formData.zip_postal_code}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="account-form-group">
                        <label>Country / Region</label>
                        <input
                            type="text"
                            name="country_region"
                            placeholder="Enter Country / Region"
                            value={formData.country_region}
                            onChange={handleChange}
                        />
                    </div>

                </div>

            </div>

            {/* ================= BUTTONS ================= */}
            <div className="account-form-buttons">

                <button
                    type="button"
                    className="account-cancel-btn"
                    onClick={() => navigate("/accounts")}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="account-save-btn"
                >
                    {buttonText}
                </button>

            </div>

        </form>
    );
}

export default AccountForm;