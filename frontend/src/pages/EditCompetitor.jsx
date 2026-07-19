import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AlertModal from "../components/AlertModal";

import { FaPen, FaTrash } from "react-icons/fa";

import {
    getCompetitorsById,
    updateCompetitor,
    addProductToCompetitor,
    updateProductOnCompetitor,
    deleteProductFromCompetitor
} from "../services/competitorsService";

// FIX: import getProducts from competitorsService (which hits /products correctly)
// The old import from productsService also works if that file exists in your project
import { getProducts } from "../services/competitorsService";

import "../css/AddEditCompetitor.css";

function EditCompetitor() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [products, setProducts] = useState([]);
    const [alertModal, setAlertModal] = useState(null);
    const [loading, setLoading] = useState(true); // FIX: loading state to prevent blank flash

    // Competitor core fields
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

    // FIX: product mappings are an array returned by the API under `products`
    // They are NOT flat fields on the competitor object — kept separate from form
    const [mappedProducts, setMappedProducts] = useState([]);

    // New product mapping row (for adding a new one)
    const [newMapping, setNewMapping] = useState({
        product_id: "",
        competitor_product_name: "",
        notes: ""
    });

    // ===================== ALERT =====================
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({
            type,
            title,
            message,
            onClose: onClose || (() => setAlertModal(null))
        });
    };

    // ===================== HANDLE CHANGE (core form) =====================
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ===================== HANDLE CHANGE (new mapping row) =====================
    const handleMappingChange = (e) => {
        setNewMapping({ ...newMapping, [e.target.name]: e.target.value });
    };

    // ===================== HANDLE CHANGE (existing mapped product inline edit) =====================
    const handleExistingMappingChange = (index, e) => {
        const updated = [...mappedProducts];
        updated[index] = { ...updated[index], [e.target.name]: e.target.value };
        setMappedProducts(updated);
    };

    // ===================== LOAD PRODUCTS DROPDOWN =====================
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await getProducts();
                setProducts(res || []);
            } catch (err) {
                console.error("Error loading products dropdown:", err);
            }
        };
        fetchProducts();
    }, []);

    // ===================== LOAD COMPETITOR DATA =====================
    useEffect(() => {
        const fetchCompetitor = async () => {
            try {
                setLoading(true);
                const data = await getCompetitorsById(id);

                // Backend returns: { competitor fields..., products: [...] }
                // FIX: do NOT try to read product_id/notes from top-level data
                // — those fields don't exist there, they live in data.products[]
                setForm({
                    name: data.name || "",
                    website: data.website || "",
                    currency: data.currency || "",
                    street_1: data.street_1 || "",
                    street_2: data.street_2 || "",
                    street_3: data.street_3 || "",
                    city: data.city || "",
                    state_province: data.state_province || "",
                    zip_postal_code: data.zip_postal_code || "",
                    country_region: data.country_region || "",
                    strength: data.strength || "",
                    weakness: data.weakness || ""
                });

                // Load existing product mappings into their own state
                setMappedProducts(data.products || []);

            } catch (err) {
                console.error("LOAD ERROR:", err);
                showAlert("error", "Error", "Failed to load competitor data");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCompetitor();
    }, [id]);

    // ===================== VALIDATION =====================
    const validate = () => {
        if (!form.name.trim()) return "Competitor name is required";
        if (!form.currency.trim()) return "Currency is required";
        if (form.website && !form.website.startsWith("http"))
            return "Website must start with http or https";
        return null;
    };

    // ===================== SAVE EXISTING PRODUCT MAPPING =====================
    const handleUpdateMapping = async (mapping) => {
        try {
            await updateProductOnCompetitor(mapping.competitor_product_id, {
                product_id: mapping.product_id,
                competitor_product_name: mapping.competitor_product_name,
                notes: mapping.notes
            });
            showAlert("success", "Saved", "Product mapping updated");
        } catch (err) {
            console.error(err);
            showAlert("error", "Error", "Failed to update product mapping");
        }
    };

    // ===================== DELETE EXISTING PRODUCT MAPPING =====================
    const handleDeleteMapping = async (competitorProductId) => {
        try {
            await deleteProductFromCompetitor(competitorProductId);
            setMappedProducts(mappedProducts.filter(
                (m) => m.competitor_product_id !== competitorProductId
            ));
        } catch (err) {
            console.error(err);
            showAlert("error", "Error", "Failed to delete product mapping");
        }
    };

    // ===================== ADD NEW PRODUCT MAPPING =====================
    const handleAddMapping = async () => {
        if (!newMapping.product_id) {
            showAlert("error", "Validation", "Please select a product to map");
            return;
        }
        try {
            const created = await addProductToCompetitor(id, newMapping);

            // Enrich with product_name for display
            const product = products.find(
                (p) => p.product_id === parseInt(newMapping.product_id)
            );
            setMappedProducts([
                ...mappedProducts,
                { ...created, product_name: product?.product_name || "" }
            ]);

            // Reset new mapping row
            setNewMapping({ product_id: "", competitor_product_name: "", notes: "" });

        } catch (err) {
            console.error(err);
            showAlert("error", "Error", "Failed to add product mapping");
        }
    };

    // ===================== SUBMIT (core competitor fields only) =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validate();
        if (error) {
            showAlert("error", "Validation Error", error);
            return;
        }

        try {
            // FIX: only send competitors-table fields to PUT /:id
            // product mapping fields belong to competitor_products table
            await updateCompetitor(id, form);

            showAlert(
                "success",
                "Success",
                "Competitor updated successfully",
                () => navigate("/competitors")
            );

        } catch (err) {
            console.error(err);
            showAlert("error", "Error", "Failed to update competitor");
        }
    };

    // ===================== RENDER =====================
    if (loading) {
        return (
            <div className="add-competitor-layout">
                <Sidebar />
                <div className="add-competitor-container">
                    <Topbar title="Edit Competitor" />
                    <p style={{ padding: "2rem" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-competitor-layout">
            <Sidebar />

            <div className="add-competitor-container">
                <Topbar title="Edit Competitor" />

                <form className="competitor-form" id="edit-competitor-form" onSubmit={handleSubmit}>

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

                        <label>Country / Region</label>
                        <input name="country_region" placeholder="Country / Region" value={form.country_region} onChange={handleChange} />
                    </div>

                    {/* ================= STRENGTH & WEAKNESS ================= */}
                    <div className="form-section">
                        <h3>Strength &amp; Weakness</h3>

                        <label>Strength</label>
                        <textarea
                            name="strength"
                            value={form.strength}
                            onChange={handleChange}
                            placeholder="Enter competitor strengths..."
                        />

                        <label>Weakness</label>
                        <textarea
                            name="weakness"
                            value={form.weakness}
                            onChange={handleChange}
                            placeholder="Enter competitor weaknesses..."
                        />
                    </div>

                    {/* ================= PRODUCT MAPPINGS (outside form, managed separately) ================= */}
                    {/* FIX: product mappings are a separate table — they have their own
                    save/delete per row and an "Add" button for new ones.
                    Putting them inside the main form submit would silently drop them. */}
                    <div className="form-section product-mapping-section">
                        <h3>Product Mappings</h3>

                        {/* Existing mappings */}
                        {mappedProducts.length === 0 && (
                            <p className="no-mapping-text">
                                No product mappings yet.
                            </p>
                        )}

                        {mappedProducts.map((mapping, index) => (
                            <div key={mapping.competitor_product_id} className="mapping-row">
                                <select
                                    name="product_id"
                                    value={mapping.product_id}
                                    onChange={(e) => handleExistingMappingChange(index, e)}
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
                                    placeholder="Enter Competitor Product Name"
                                    value={mapping.competitor_product_name || ""}
                                    onChange={(e) => handleExistingMappingChange(index, e)}
                                />
                                <input
                                    name="notes"
                                    placeholder="Enter Notes"
                                    value={mapping.notes || ""}
                                    onChange={(e) => handleExistingMappingChange(index, e)}
                                />
                                <div className="mapping-actions">
                                    <button
                                        className="save-btn"
                                        type="button"
                                        onClick={() => handleUpdateMapping(mapping)}
                                    >
                                        <FaPen />
                                    </button>

                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() => handleDeleteMapping(mapping.competitor_product_id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add new mapping row */}
                        <div className="mapping-row mapping-row--new">
                            <select
                                name="product_id"
                                value={newMapping.product_id}
                                onChange={handleMappingChange}
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
                                placeholder="Enter Competitor Product Name"
                                value={newMapping.competitor_product_name}
                                onChange={handleMappingChange}
                            />
                            <input
                                name="notes"
                                placeholder="Enter Notes"
                                value={newMapping.notes}
                                onChange={handleMappingChange}
                            />

                            <button type="button" onClick={handleAddMapping} className="add-mapping-btn">
                                + Add Mapping
                            </button>
                        </div>

                    </div>
                    {/* ================= FORM ACTIONS ================= */}
                    <div className="form-actions">
                        <button type="button"  className="comp-cancel-btn" onClick={() => navigate("/competitors")}>
                            Cancel
                        </button>
                        <button type="submit">
                            Update Competitor
                        </button>
                    </div>
                </form>
            </div>

            {/* ALERT */}
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

export default EditCompetitor;