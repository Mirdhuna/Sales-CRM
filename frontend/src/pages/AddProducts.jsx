import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../css/AddEditProduct.css";
import { createProduct } from "../services/productsService";
import AlertModal from "../components/AlertModal";

const AddProduct = () => {
    const navigate = useNavigate();

    const [alertModal, setAlertModal] = useState(null);

    const [form, setForm] = useState({
        product_name: "",
        valid_from: "",
        valid_to: "",
        description: "",
        unit_of_measure: "",
        unit_price: "",
        list_price: "",
        cost_price: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const errors = [];

        if (!form.product_name?.trim()) {
            errors.push("Product name is required");
        }

        if (!form.list_price) {
            errors.push("List price is required");
        }

        if (!form.cost_price) {
            errors.push("Cost price is required");
        }

        if (!form.unit_of_measure) {
            errors.push("Unit of measure is required");
        }

        if (form.unit_price && Number(form.unit_price) < 0) {
            errors.push("Unit price cannot be negative");
        }

        if (form.list_price && Number(form.list_price) < 0) {
            errors.push("List price cannot be negative");
        }

        if (form.cost_price && Number(form.cost_price) < 0) {
            errors.push("Cost price cannot be negative");
        }

        if (
            form.cost_price &&
            form.list_price &&
            Number(form.cost_price) > Number(form.list_price)
        ) {
            errors.push("Cost price cannot be greater than list price");
        }

        return errors;
    };

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();

        if (errors.length > 0) {
            showAlert("warning", "Missing Fields", errors.join("\n"));
            return; //STOP HERE
        }
        try {
            await createProduct(form); // ONLY form data
            showAlert("success", "product created", "Product created successfully!", () => {
                setAlertModal(null);
                navigate("/products");

            });
        } catch (error) {
            console.error("Error adding product:", error);
            showAlert("error", "Failed", "Failed to add product");
        }
    };
    return (
        <div className="add-product-layout">
            <Sidebar />

            <div className="add-product-container">
                <Topbar title="Add Product" />

                <div className="page-content">
                    <div className="product-card">

                        {/* FIX: buttons are now INSIDE the form, actions div is after the grid */}
                        <form onSubmit={handleSubmit}>

                            <div className="product-form-grid">


                                {/* Product Name */}
                                <div className="product-form-group">
                                    <label>Product Name <span className="imp">*</span></label>
                                    <input
                                        type="text"
                                        name="product_name"
                                        placeholder="Enter Product Name"
                                        value={form.product_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Valid From */}
                                <div className="product-form-group">
                                    <label>Valid From</label>
                                    <input
                                        type="date"
                                        name="valid_from"
                                        value={form.valid_from}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Valid To */}
                                <div className="product-form-group">
                                    <label>Valid To</label>
                                    <input
                                        type="date"
                                        name="valid_to"
                                        value={form.valid_to}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Description full width */}
                                <div className="product-form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        placeholder="Enter Description"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Unit of Measure */}
                                <div className="product-form-group">
                                    <label>Unit of Measure <span className="imp">*</span></label>
                                    <select
                                        name="unit_of_measure"
                                        value={form.unit_of_measure}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Unit</option>
                                        <option value="PCS">PCS</option>
                                        <option value="BOX">BOX</option>
                                        <option value="KG">KG</option>
                                        <option value="LIT">LIT</option>
                                        <option value="PKT">PKT</option>
                                        <option value="BAG">BAG</option>
                                    </select>
                                </div>

                                {/* Unit Price */}
                                <div className="product-form-group">
                                    <label>Unit Price</label>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        placeholder="Enter Unit Price"
                                        value={form.unit_price}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* List Price */}
                                <div className="product-form-group">
                                    <label>List Price <span className="imp">*</span></label>
                                    <input
                                        type="number"
                                        name="list_price"
                                        placeholder="Enter List Price"
                                        value={form.list_price}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Cost Price */}
                                <div className="product-form-group">
                                    <label>Cost Price <span className="imp">*</span></label>
                                    <input
                                        type="number"
                                        name="cost_price"
                                        placeholder="Enter Cost Price"
                                        value={form.cost_price}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>

                            {/* FIX: actions outside grid but inside form, no product-form-group class */}
                            <div className="product-form-actions">
                                <button
                                    type="button"
                                    className="product-cancel-btn"
                                    onClick={() => navigate("/products")}
                                >
                                    Cancel
                                </button>

                                <button type="submit" className="product-save-btn">
                                    Submit
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
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
};

export default AddProduct;