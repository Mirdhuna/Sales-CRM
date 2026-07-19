import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AlertModal from "../components/AlertModal";

// FIX: createCompetitor + addProductToCompetitor both needed
// getProducts imported from competitorsService (hits /products correctly)
import {
    createCompetitor,
    addProductToCompetitor,
    getProducts
} from "../services/competitorsService";

import "../css/AddEditCompetitor.css";

function AddCompetitor() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [alertModal, setAlertModal] = useState(null);

    // Core competitor fields only — product mapping is a separate table
    const [form, setForm] = useState({
        name: "",
        website: "",
        currency: "",
        street_1: "",
        street_2: "",
        street_3: "",
        city: "",
        state_province: "",
        zip_postal_code: "",
        country_region: "",
        strength: "",
        weakness: ""
    });

    // Array of mapping rows — each saved separately after competitor is created
    const [mappings, setMappings] = useState([
        { product_id: "", competitor_product_name: "", notes: "" }
    ]);

    // ===================== ALERT =====================
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({
            type,
            title,
            message,
            onClose: onClose || (() => setAlertModal(null))
        });
    };

    // ===================== LOAD PRODUCTS DROPDOWN =====================
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await getProducts();
                setProducts(res || []);
            } catch (err) {
                console.error("Error loading products:", err);
            }
        };
        fetchProducts();
    }, []);

    // ===================== HANDLE CHANGE (core form) =====================
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ===================== HANDLE CHANGE (mapping row by index) =====================
    const handleMappingChange = (index, e) => {
        const updated = [...mappings];
        updated[index] = { ...updated[index], [e.target.name]: e.target.value };
        setMappings(updated);
    };

    // ===================== ADD / REMOVE MAPPING ROWS =====================
    const addMappingRow = () => {
        setMappings([...mappings, { product_id: "", competitor_product_name: "", notes: "" }]);
    };

    const removeMappingRow = (index) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    // ===================== VALIDATION =====================
    const validate = () => {
        if (!form.name.trim())     return "Competitor name is required";
        if (!form.currency.trim()) return "Currency is required";
        if (form.website && !form.website.startsWith("http"))
            return "Website must start with http or https";
        return null;
    };

    // ===================== SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validate();
        if (error) {
            showAlert("error", "Validation Error", error);
            return;
        }

        try {
            // Step 1: create the competitor (competitors table only)
            const created = await createCompetitor(form);

            // Step 2: save every filled-in mapping row separately
            const filledMappings = mappings.filter(m => m.product_id);
            for (const m of filledMappings) {
                await addProductToCompetitor(created.competitor_id, m);
            }

            showAlert(
                "success",
                "Success",
                "Competitor created successfully",
                () => navigate("/competitors")
            );

        } catch (err) {
            console.error(err);
            showAlert("error", "Error", "Failed to create competitor");
        }
    };

    return (
        <div className="add-competitor-layout">
            <Sidebar />

            <div className="add-competitor-container">
                <Topbar title="Add Competitor" />

                <form className="competitor-form" onSubmit={handleSubmit}>

                    {/* ================= BASIC INFO ================= */}
                    <div className="form-section">
                        <h3>Basic Information</h3>

                        <label>Competitor Name <span className="imp">*</span></label>
                        <input
                            name="name"
                            placeholder="Enter Competitor Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />

                        <label>Website</label>
                        <input
                            name="website"
                            placeholder="Enter Website (https://...)"
                            value={form.website}
                            onChange={handleChange}
                        />

                        <label>Currency <span className="imp">*</span></label>
                        <select
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Currency</option>
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                            <option value="SGD">SGD</option>
                            <option value="JPY">JPY</option>
                            <option value="VND">VND</option>
                        </select>
                    </div>

                    {/* ================= LOCATION ================= */}
                    <div className="form-section">
                        <h3>Location</h3>

                        <label>Street 1</label>
                        {/* FIX: all location inputs were missing value= prop (uncontrolled) */}
                        <input name="street_1" placeholder="Enter Street 1" value={form.street_1} onChange={handleChange} />

                        <label>Street 2</label>
                        <input name="street_2" placeholder="Enter Street 2" value={form.street_2} onChange={handleChange} />

                        <label>Street 3</label>
                        <input name="street_3" placeholder="Enter Street 3" value={form.street_3} onChange={handleChange} />

                        <label>City</label>
                        <input name="city" placeholder="Enter City" value={form.city} onChange={handleChange} />

                        <label>State / Province</label>
                        <input name="state_province" placeholder="Enter State / Province" value={form.state_province} onChange={handleChange} />

                        <label>Zip Code / Postal Code</label>
                        <input name="zip_postal_code" placeholder="Enter Zip Code / Postal Code" value={form.zip_postal_code} onChange={handleChange} />

                        {/* FIX: <spna> typo corrected to <span> */}
                        <label>Country / Region <span className="imp">*</span></label>
                        <input name="country_region" placeholder="Enter Country / Region" value={form.country_region} onChange={handleChange} />
                    </div>

                    {/* ================= STRENGTH & WEAKNESS ================= */}
                    <div className="form-section">
                        <h3>Strength &amp; Weakness</h3>

                        <label>Strength</label>
                        <textarea
                            name="strength"
                            placeholder="Enter Competitor Strength (e.g. strong pricing, global presence...)"
                            value={form.strength}
                            onChange={handleChange}
                        />

                        <label>Weakness</label>
                        <textarea
                            name="weakness"
                            placeholder="Enter Competitor Weakness (e.g. poor UI, weak SMB market...)"
                            value={form.weakness}
                            onChange={handleChange}
                        />
                    </div>

                    {/* ================= PRODUCT MAPPING ================= */}
                    <div className="form-section">
                        <h3>Product Mapping (Optional)</h3>

                        {mappings.map((m, index) => (
                            <div key={index} className="mapping-row">
                                <select
                                    name="product_id"
                                    value={m.product_id}
                                    onChange={(e) => handleMappingChange(index, e)}
                                >
                                    <option value="">Select Product</option>
                                    {products.map((p) => (
                                        <option key={p.product_id} value={p.product_id}>
                                            {p.product_name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    name="competitor_product_name"
                                    placeholder="Competitor Product Name"
                                    value={m.competitor_product_name}
                                    onChange={(e) => handleMappingChange(index, e)}
                                />

                                <input
                                    name="notes"
                                    placeholder="Notes"
                                    value={m.notes}
                                    onChange={(e) => handleMappingChange(index, e)}
                                />

                                {/* Only show Remove if more than one row exists */}
                                {mappings.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => removeMappingRow(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn-add-row"
                            onClick={addMappingRow}
                        >
                            + Add Another Product
                        </button>
                    </div>

                    {/* ================= ACTIONS ================= */}
                    <div className="form-actions">
                        <button className="comp-cancel-btn" type="button" onClick={() => navigate("/competitors")}>
                            Cancel
                        </button>
                        <button type="submit">
                            Save Competitor
                        </button>
                    </div>

                </form>
            </div>

            {/* ALERT MODAL */}
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

export default AddCompetitor;