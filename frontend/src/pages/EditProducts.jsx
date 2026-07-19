import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../css/AddEditProduct.css";
import { updateProduct, getProductById } from "../services/productsService";
import AlertModal from "../components/AlertModal";

const EditProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [alertModal, setAlertModal] = useState(null);

    const [form, setForm] = useState({
        product_name: "",
        valid_from: "",
        valid_to: "",
        description: "",
        unit_of_measure: "",
        list_price: "",
        cost_price: "",
        product_code: ""
    });

    // =========================
    // FETCH PRODUCT ON LOAD
    // =========================
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getProductById(id);

                setForm({
                    product_name: data.product_name || "",
                    valid_from: data.valid_from ? data.valid_from.split("T")[0] : "",
                    valid_to: data.valid_to ? data.valid_to.split("T")[0] : "",
                    description: data.description || "",
                    unit_of_measure: data.unit_of_measure || "",
                    list_price: data.list_price ?? "",
                    cost_price: data.cost_price ?? "",
                    product_code: data.product_code || ""
                });

            } catch (err) {
                console.error("Error fetching product:", err);
            }
        };

        fetchProduct();
    }, [id]);

    // =========================
    // HANDLE INPUT CHANGE
    // =========================
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        const errors = [];

        if (!form.product_name?.trim()) {
            errors.push("Product name is required");
        }

        if (!form.list_price) {
            errors.push("List price is required ");
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


    // =========================
    // SUBMIT UPDATE
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();

        if (errors.length > 0) {
            showAlert("warning", "Missing Fields", errors.join("\n"));
            return;
        }

        try {
            await updateProduct(id, form);

            showAlert("success","Product updated","Product updated successfully!", () => {
                setAlertModal(null);
                navigate("/products");
            });

        } catch (error) {
            console.error("Error updating product:", error);
            showAlert("error","Failed","Failed to update product");
        }
    };

    return (
        <div className="add-product-layout">
            <Sidebar />

            <div className="add-product-container">
                <Topbar title="Edit Product" />

                <div className="page-content">
                    <div className="product-card">

                        <form onSubmit={handleSubmit}>

                            <div className="product-form-grid">

                                {/* PRODUCT CODE (READ ONLY) */}
                                <div className="product-form-group">
                                    <label>Product Code</label>
                                    <input
                                        value={form.product_code}
                                        disabled
                                    />
                                </div>

                                {/* PRODUCT NAME */}
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

                                {/* VALID FROM */}
                                <div className="product-form-group">
                                    <label>Valid From</label>
                                    <input
                                        type="date"
                                        name="valid_from"
                                        value={form.valid_from}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* VALID TO */}
                                <div className="product-form-group">
                                    <label>Valid To</label>
                                    <input
                                        type="date"
                                        name="valid_to"
                                        value={form.valid_to}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* DESCRIPTION */}
                                <div className="product-form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        placeholder="Enter Description"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* UNIT OF MEASURE */}
                                <div className="product-form-group">
                                    <label>Unit of Measure <span className="imp">*</span></label>
                                    <select
                                        name="unit_of_measure"
                                        value={form.unit_of_measure}
                                        onChange={handleChange}
                                    >
                                        <option value="PCS">PCS</option>
                                        <option value="BOX">BOX</option>
                                        <option value="KG">KG</option>
                                        <option value="LIT">LIT</option>
                                        <option value="PKT">PKT</option>
                                        <option value="BAG">BAG</option>
                                    </select>
                                </div>

                                {/* LIST PRICE */}
                                <div className="product-form-group">
                                    <label>List Price <span className="imp">*</span></label>
                                    <input
                                        type="number"
                                        name="list_price"
                                        placeholder="Enter ListPrice"
                                        value={form.list_price}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* COST PRICE */}
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

                            {/* ACTION BUTTONS */}
                            <div className="product-form-actions">

                                <button
                                    type="button"
                                    className="product-cancel-btn"
                                    onClick={() => navigate("/products")}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="product-save-btn"
                                >
                                    Update
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

export default EditProduct;