import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrash } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { createOpportunity } from "../services/opportunitiesService";
import { getAccounts } from "../services/accountsService";
import { getContacts } from "../services/contactsService";
import { getProducts } from "../services/productsService";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import "../css/AddEditOpp.css";

function AddOpportunity() {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const [showProductModal, setShowProductModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    const [loading, setLoading] = useState(false);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal,setConfirmModal]=useState(null)

    const [products, setProducts] = useState([]);

    const [productForm, setProductForm] = useState({
        product_id: "",
        product_name: "",
        unit_of_measure: "PCS",
        price_per_unit: "",
        quantity: "",
        manual_discount: "",
        tax_amount: ""
    });

    const [formData, setFormData] = useState({
        topic: "",
        account_id: "",
        primary_contact_id: "",
        budget_amount: "",
        purchase_timeframe: "Unknown",
        purchase_process: "Unknown",
        currency: "USD",
        description: "",
        customer_need: "",
        proposed_solution: "",
        status: "New"
    });

    const validateForm = () => {
        const errors = [];

        // REQUIRED CORE FIELDS
        if (!formData.topic?.trim()) {
            errors.push("Topic is required");
        }

        if (!formData.account_id) {
            errors.push("Account is required");
        }

        if (!formData.primary_contact_id) {
            errors.push("Primary Contact is required");
        }

        if (!formData.budget_amount) {
            errors.push("Budget Amount is required");
        }
        // OPTIONAL BUT SAFE CHECKS
        if (formData.budget_amount && Number(formData.budget_amount) < 0) {
            errors.push("Budget cannot be negative");
        }

        // PRODUCT VALIDATION (VERY IMPORTANT IN OPPORTUNITY)
        if (products.length === 0) {
            errors.push("At least one product must be added");
        }

        // PRODUCT FIELD VALIDATION
        products.forEach((p, index) => {
            if (!p.product_id) {
                errors.push(`Product ${index + 1}: Product is required`);
            }
            if (!p.quantity || Number(p.quantity) <= 0) {
                errors.push(`Product ${index + 1}: Quantity must be greater than 0`);
            }
            if (Number(p.price_per_unit) < 0) {
                errors.push(`Product ${index + 1}: Price cannot be negative`);
            }
        });

        return errors;
    };
    useEffect(() => {
        loadAccounts();
        loadContacts();
        loadProducts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };
    const loadContacts = async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            console.log("Products API Response:", data);
            setAllProducts(data);
        } catch (err) {
            console.error("Products Error:", err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calculateProductTotal = (p) => {
        return (
            Number(p.price_per_unit || 0) *
            Number(p.quantity || 0) -
            Number(p.manual_discount || 0) +
            Number(p.tax_amount || 0)
        );
    };

    const calculateGrandTotal = () => {
        return products.reduce((sum, p) => sum + calculateProductTotal(p), 0);
    };

    const openAddProductModal = () => {
        setEditingIndex(null);
        setProductForm({
            product_id: "",
            product_name: "",
            unit_of_measure: "PCS",
            price_per_unit: "",
            quantity: "",
            manual_discount: "",
            tax_amount: ""
        });
        setShowProductModal(true);
    };

    const saveProduct = () => {
        const selectedProduct = allProducts.find(
            (p) => p.product_id === Number(productForm.product_id)
        );

        // FIX 1: product_id is cast to Number before saving
        const productData = {
            ...productForm,
            product_id: Number(productForm.product_id),
            product_name: selectedProduct?.product_name || "",
            unit_of_measure: selectedProduct?.unit_of_measure || "PCS"
        };

        if (editingIndex !== null) {
            const updated = [...products];
            updated[editingIndex] = productData;
            setProducts(updated);
        } else {
            setProducts([...products, productData]);
        }

        setShowProductModal(false);
        setEditingIndex(null);
        setProductForm({
            product_id: "",
            product_name: "",
            unit_of_measure: "PCS",
            price_per_unit: "",
            quantity: "",
            manual_discount: "",
            tax_amount: ""
        });
    };

    const editProduct = (index) => {
        setEditingIndex(index);
        setProductForm(products[index]);
        setShowProductModal(true);
    };

    const deleteProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
        
    };

    // FIX 2: e.preventDefault() moved to the top before any early returns
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();

        if (errors.length > 0) {
            showAlert("warning", "Missing Fields", errors.join("\n"))
            return;
        }

        setLoading(true);

        try {
            await createOpportunity({
                ...formData,
                products
            });
            console.log("Sending:", formData);
            showAlert("success", "Opportunity created", "Opportunity created successfully!", () => {
                setAlertModal(null);
                navigate("/opportunities");
            });
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to add Opportunity");
        }finally{
            setLoading(false);
        }
    };

    const grandTotal = calculateGrandTotal();

    return (
        <div className="add-opportunity-layout">
            <Sidebar />

            <div className="add-opportunity-container">
                <Topbar title="Add Opportunity" />

                <form onSubmit={handleSubmit}>
                    <div className="opportunity-card">

                        <h3>Opportunity Information</h3>

                        <div className="form-grid">

                            <div className="form-group">
                                <label>Topic <span className="imp">*</span></label>
                                <input
                                    type="text"
                                    name="topic"
                                    placeholder="Enter Topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Account <span className="imp">*</span></label>
                                <select
                                    name="account_id"
                                    value={formData.account_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option
                                            key={acc.account_id}
                                            value={acc.account_id}
                                        >
                                            {acc.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Primary Contact <span className="imp">*</span></label>
                                <select
                                    name="primary_contact_id"
                                    value={formData.primary_contact_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Contact</option>
                                    {contacts.map((contact) => (
                                        <option
                                            key={contact.contact_id}
                                            value={contact.contact_id}
                                        >
                                            {contact.first_name}{" "}
                                            {contact.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Budget Amount <span className="imp">*</span></label>
                                <input
                                    type="number"
                                    name="budget_amount"
                                    placeholder="Enter Budget"
                                    value={formData.budget_amount}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
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

                            <div className="form-group">
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

                            <div className="form-group">
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

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="New">New</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    rows="4"
                                    name="description"
                                    placeholder="Enter Description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                        <div className="products-section">

                            <div className="products-header">
                                <button
                                    type="button"
                                    className="add-product-btn"
                                    onClick={openAddProductModal}
                                >
                                    + Add Product
                                </button>
                            </div>

                            <div className="products-table-wrapper">
                                <table className="products-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Unit</th>
                                            <th>Price</th>
                                            <th>Qty</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>Total</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="8">No Products Added</td>
                                            </tr>
                                        ) : (
                                            products.map((p, index) => {
                                                const total = calculateProductTotal(p);
                                                return (
                                                    <tr key={index}>
                                                        <td>{p.product_name}</td>
                                                        <td>{p.unit_of_measure}</td>
                                                        <td>{p.price_per_unit}</td>
                                                        <td>{p.quantity}</td>
                                                        <td>{p.manual_discount}</td>
                                                        <td>{p.tax_amount}</td>
                                                        <td className="total-cell">
                                                            {total.toFixed(2)}
                                                        </td>
                                                        <td className="actions-cell">
                                                            <button
                                                                type="button"
                                                                className="edit-btn"
                                                                onClick={() => editProduct(index)}
                                                            >
                                                                <FaPen />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="delete-row-btn"
                                                                onClick={() => deleteProduct(index)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>

                        <div className="amount-summary-section">

                            <div className="summary-card">
                                <h4>Total Products</h4>
                                <p>{products.length}</p>
                            </div>

                            <div className="summary-card">
                                <h4>Subtotal</h4>
                                <p>
                                    {products
                                        .reduce(
                                            (sum, p) =>
                                                sum +
                                                Number(p.price_per_unit || 0) *
                                                Number(p.quantity || 0),
                                            0
                                        )
                                        .toFixed(2)}
                                </p>
                            </div>

                            <div className="summary-card">
                                <h4>Total Discount</h4>
                                <p>
                                    {products
                                        .reduce(
                                            (sum, p) =>
                                                sum + Number(p.manual_discount || 0),
                                            0
                                        )
                                        .toFixed(2)}
                                </p>
                            </div>

                            <div className="summary-card">
                                <h4>Total Tax</h4>
                                <p>
                                    {products
                                        .reduce(
                                            (sum, p) =>
                                                sum + Number(p.tax_amount || 0),
                                            0
                                        )
                                        .toFixed(2)}
                                </p>
                            </div>

                            <div className="summary-card grand-total-card">
                                <h4>Grand Total</h4>
                                <p>{grandTotal.toFixed(2)}</p>
                            </div>

                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => navigate("/opportunities")}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="op-save-btn">
                                Submit
                            </button>
                        </div>

                    </div>
                </form>
            </div>

            {/* Product Modal */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="product-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-header">
                            <h3>
                                {editingIndex !== null ? "Edit Product" : "Add Product"}
                            </h3>
                            <button
                                className="close-modal-btn"
                                onClick={() => setShowProductModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">

                            <div className="form-row">
                                <label>Product name <span className="imp">*</span></label>
                                <select
                                    value={productForm.product_id}
                                    onChange={(e) => {
                                        const selectedProduct = allProducts.find(
                                            (p) => p.product_id === Number(e.target.value)
                                        );
                                        setProductForm({
                                            ...productForm,
                                            product_id: e.target.value,
                                            product_name: selectedProduct?.product_name || "",
                                            unit_of_measure: selectedProduct?.unit_of_measure || "PCS",
                                            price_per_unit: selectedProduct?.list_price || 0
                                        });
                                    }}
                                >
                                    <option value="">Select Product</option>
                                    {allProducts.map((product) => (
                                        <option
                                            key={product.product_id}
                                            value={product.product_id}
                                        >
                                            {product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* FIX 3: Removed duplicate nested form-row for Unit of Measure */}
                            <div className="form-row">
                                <label>Unit of Measure</label>
                                <input
                                    type="text"
                                    value={productForm.unit_of_measure}
                                    readOnly
                                />
                            </div>

                            <div className="form-row-double">
                                <div className="form-row">
                                    <label>Price Per Unit <span className="imp">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={productForm.price_per_unit}
                                        readOnly
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Quantity <span className="imp">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={productForm.quantity}
                                        onChange={(e) =>
                                            setProductForm({
                                                ...productForm,
                                                quantity: e.target.value
                                            })
                                        }
                                        required
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="form-row-double">
                                <div className="form-row">
                                    <label>Discount</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={productForm.manual_discount}
                                        onChange={(e) =>
                                            setProductForm({
                                                ...productForm,
                                                manual_discount: e.target.value
                                            })
                                        }
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Tax Amount</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={productForm.tax_amount}
                                        onChange={(e) =>
                                            setProductForm({
                                                ...productForm,
                                                tax_amount: e.target.value
                                            })
                                        }
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="modal-buttons">
                            <button
                                type="button"
                                className="modal-cancel-btn"
                                onClick={() => setShowProductModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="modal-save-btn"
                                onClick={saveProduct}
                            >
                                Submit
                            </button>
                        </div>

                    </div>
                </div>
            )}

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

export default AddOpportunity;