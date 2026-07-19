import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { FaPen, FaTrash } from 'react-icons/fa';

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

import { createOrderFromQuote } from "../services/orderService";
import { generateQuotePdf } from "../components/pdfGenerator";
import { getQuoteById, updateQuote } from "../services/quotesService";
import { getProducts } from "../services/productsService";
import "../css/editQuotes.css";

function EditQuotes() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState(null);
    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        opportunity_id: "",
        account_id: "",
        topic: "",
        currency: "",
        payment_terms: "",
        shipping_method: "",
        status: "",
        bill_to_street_1: "",
        bill_to_street_2: "",
        bill_to_street_3: "",
        bill_to_city: "",
        bill_to_state: "",
        bill_to_zip: "",
        bill_to_country: "",
        ship_to_street_1: "",
        ship_to_street_2: "",
        ship_to_street_3: "",
        ship_to_city: "",
        ship_to_state: "",
        ship_to_zip: "",
        ship_to_country: "",
        detail_amount: 0,
        total_discount: 0,
        total_tax: 0,
        total_amount: 0
    });

    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [productForm, setProductForm] = useState({
        product_id: "",
        product_name: "",
        unit_of_measure: "PCS",
        price_per_unit: 0,
        quantity: 0,
        manual_discount: 0,
        tax_amount: 0
    });

    useEffect(() => { loadProducts(); loadQuote(); }, []);

    /* ─────────────── Helpers ─────────────── */
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    /* ─────────────── Load Data ─────────────── */
    const loadQuote = async () => {
        try {
            const data = await getQuoteById(id);
            setFormData({ ...data });
            setProducts(data.products || []);
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to load quote. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setAllProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    /* ─────────────── Calculations ─────────────── */
    const calculateProductTotal = (p) => {
        const amount = Number(p.price_per_unit || 0) * Number(p.quantity || 0);
        return amount - Number(p.manual_discount || 0) + Number(p.tax_amount || 0);
    };

    const calculateGrandTotal = () => {
        return products.reduce((sum, p) => sum + calculateProductTotal(p), 0);
    };

    /* ─────────────── Product Modal ─────────────── */
    const openAddProductModal = () => {
        setEditingIndex(null);
        setProductForm({
            product_id: "",
            product_name: "",
            unit_of_measure: "PCS",
            price_per_unit: 0,
            quantity: 0,
            manual_discount: 0,
            tax_amount: 0
        });
        setShowProductModal(true);
    };

    const saveProduct = () => {
        const selectedProduct = allProducts.find(
            p => p.product_id === Number(productForm.product_id)
        );

        const productData = {
            ...productForm,
            product_name: selectedProduct?.product_name || "",
            list_price: selectedProduct?.list_price || 0,
            cost_price: selectedProduct?.cost_price || 0
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
    };

    const editProduct = (index) => {
        setEditingIndex(index);
        setProductForm(products[index]);
        setShowProductModal(true);
    };

    const deleteProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    /* ─────────────── Handle Change ─────────────── */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* ─────────────── Validation ─────────────── */
    const validateForm = () => {
        const errors = [];

        if (!formData.topic?.trim()) {
            errors.push("Topic is required");
        }

        if (!formData.account_id) {
            errors.push("Account is required");
        }

        if (formData.budget_amount && Number(formData.budget_amount) < 0) {
            errors.push("Budget cannot be negative");
        }

        if (!products || products.length === 0) {
            errors.push("At least one product is required");
        }

        products.forEach((p, index) => {
            if (!p.product_id) {
                errors.push(`Product ${index + 1}: Product missing`);
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

    /* ─────────────── Update Quote ─────────────── */
    const handleUpdate = async () => {
        const errors = validateForm();

        if (errors.length > 0) {
            showAlert("warning", "Please Fix the Following", errors.join("\n"));
            return;
        }

        try {
            await updateQuote(id, { ...formData, products });
            showAlert("success", "Quote Updated", "Quote updated successfully.", () => {
                setAlertModal(null);
                navigate("/quotes");
            });
        } catch (err) {
            console.error(err);
            showAlert("error", "Update Failed", "Failed to update quote. Please try again.");
        }
    };

    /* ─────────────── Close Quote ─────────────── */
    const handleCloseQuote = () => {
        setConfirmModal({
            title: "Close Quote?",
            message: "Are you sure you want to close this quote? This action cannot be undone.",
            confirmText: "Close Quote",
            confirmClass: "confirm-modal-delete-btn",
            icon: "close",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await updateQuote(id, { ...formData, products, status: "Lost" });
                    showAlert("success", "Quote Closed", "Quote has been closed successfully.", () => {
                        setAlertModal(null);
                        navigate("/quotes");
                    });
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", "Failed to close the quote. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Create Order ─────────────── */
    const handleCreateOrder = () => {

        // Prevent duplicate order creation
        if (formData.status === "Won") {
            showAlert(
                "warning",
                "Order Already Created",
                "This quote has already been converted into an order."
            );
            return;
        }


        if (!products || products.length === 0) {
            showAlert("warning", "Missing Product", "At least one product is required to create an order.");
            return;
        }
        setConfirmModal({
            title: "Create Order?",
            message: "Are you sure you want to create an order from this quote?",
            confirmText: "Create Order",
            confirmClass: "confirm-modal-won-btn",
            icon: "paid",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await updateQuote(id, { ...formData, products });
                    await createOrderFromQuote(id);
                    showAlert("success", "Order Created", "Order created successfully.", () => {
                        setAlertModal(null);
                        navigate("/orders");
                    });
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", "Failed to create order from quote. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Loading ─────────────── */
    if (loading) {
        return <h3>Loading...</h3>;
    }

    /* ─────────────── Render ─────────────── */
    return (
        <div className="quote-layout">
            <Sidebar />
            <div className="quote-content">
                <Topbar title="Edit Quote" />
                <br />
                <div className="bc">
                    <span className="bc-link" onClick={() => navigate("/quotes")}>Quote</span>
                    <span className="bc-seperator"> › </span>
                    <span className="bc-current">Edit Quote</span>
                </div>
                <br />

                <div className="quote-card">
                    <div className="form-grid">

                        <div className="form-group">
                            <label>Topic <span className="imp">*</span></label>
                            <input name="topic" value={formData.topic || ""} onChange={handleChange} placeholder="Enter Topic" />
                        </div>

                        <div className="form-group">
                            <label>Currency <span className="imp">*</span></label>
                            <select name="currency" value={formData.currency || ""} onChange={handleChange}>
                                <option value="USD">USD</option>
                                <option value="INR">INR</option>
                                <option value="SGD">SGD</option>
                                <option value="JPY">JPY</option>
                                <option value="VND">VND</option>
                                <option value="MYR">MYR</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Payment Terms</label>
                            <select name="payment_terms" value={formData.payment_terms || ""} onChange={handleChange}>
                                <option value="">Select Payment Terms</option>
                                <option value="Net 25">Net 25</option>
                                <option value="Net 50">Net 50</option>
                                <option value="Net 75">Net 75</option>
                                <option value="Net 100">Net 100</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Shipping Method</label>
                            <select name="shipping_method" value={formData.shipping_method || ""} onChange={handleChange}>
                                <option value="">Select Shipping Method</option>
                                <option value="FedEx">FedEx</option>
                                <option value="DHL">DHL</option>
                                <option value="UPS">UPS</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" value={formData.status || ""} onChange={handleChange}>
                                <option value="Draft">Draft</option>
                                <option value="Active">Open</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                                <option value="Canceled">Canceled</option>
                            </select>
                        </div>

                    </div>

                    <br />
                    <h3>Bill To</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Bill To Street 1</label>
                            <input name="bill_to_street_1" placeholder="Enter Street 1" value={formData.bill_to_street_1 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To Street 2</label>
                            <input name="bill_to_street_2" placeholder="Enter Street 2" value={formData.bill_to_street_2 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To Street 3</label>
                            <input name="bill_to_street_3" placeholder="Enter Street 3" value={formData.bill_to_street_3 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To City</label>
                            <input name="bill_to_city" placeholder="Enter City" value={formData.bill_to_city || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To State</label>
                            <input name="bill_to_state" placeholder="Enter State / Province" value={formData.bill_to_state || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To Zip / Postal Code</label>
                            <input name="bill_to_zip" placeholder="Enter Zip / Postal Code" value={formData.bill_to_zip || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bill To Country / Region</label>
                            <input name="bill_to_country" placeholder="Enter Country / Region" value={formData.bill_to_country || ""} onChange={handleChange} />
                        </div>
                    </div>

                    <br />
                    <h3>Ship To</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Ship To Street 1</label>
                            <input name="ship_to_street_1" placeholder="Street 1" value={formData.ship_to_street_1 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To Street 2</label>
                            <input name="ship_to_street_2" placeholder="Enter Street 2" value={formData.ship_to_street_2 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To Street 3</label>
                            <input name="ship_to_street_3" placeholder="Enter Street 3" value={formData.ship_to_street_3 || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To City</label>
                            <input name="ship_to_city" placeholder="Enter City" value={formData.ship_to_city || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To State / Province</label>
                            <input name="ship_to_state" placeholder="Enter State / Province" value={formData.ship_to_state || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To Zip / Postal Code</label>
                            <input name="ship_to_zip" placeholder="Enter Zip / Postal Code" value={formData.ship_to_zip || ""} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ship To Country / Region</label>
                            <input name="ship_to_country" placeholder="Enter Country / Region" value={formData.ship_to_country || ""} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* ── Products Section ── */}
                <div className="quote-card">
                    <div className="section-header">
                        <h3>Products</h3>
                        <button type="button" className="add-btn" onClick={openAddProductModal}>
                            Add Product
                        </button>
                    </div>

                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Unit</th>
                                <th>Price Per Unit</th>
                                <th>Quantity</th>
                                <th>Amount</th>
                                <th>Discount</th>
                                <th>Tax</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="9">No Products Added</td>
                                </tr>
                            ) : (
                                products.map((p, index) => {
                                    const amount = Number(p.price_per_unit || 0) * Number(p.quantity || 0);
                                    const total = amount - Number(p.manual_discount || 0) + Number(p.tax_amount || 0);
                                    return (
                                        <tr key={index}>
                                            <td>{p.product_name}</td>
                                            <td>{p.unit_of_measure}</td>
                                            <td>{p.price_per_unit}</td>
                                            <td>{p.quantity}</td>
                                            <td>{amount.toFixed(2)}</td>
                                            <td>{p.manual_discount}</td>
                                            <td>{p.tax_amount}</td>
                                            <td>{total.toFixed(2)}</td>
                                            <td>
                                                <button type="button" onClick={() => editProduct(index)}><FaPen /></button>
                                                <button type="button" onClick={() => deleteProduct(index)}><FaTrash /></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Amount Summary ── */}
                <div className="amount-summary-section">
                    <div className="summary-card">
                        <h4>Total Products</h4>
                        <p>{products.length}</p>
                    </div>
                    <div className="summary-card">
                        <h4>Subtotal</h4>
                        <p>₹ {products.reduce((sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className="summary-card">
                        <h4>Total Discount</h4>
                        <p>₹ {products.reduce((sum, p) => sum + Number(p.manual_discount || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className="summary-card">
                        <h4>Total Tax</h4>
                        <p>₹ {products.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0).toFixed(2)}</p>
                    </div>
                    <div className="summary-card grand-total-card">
                        <h4>Grand Total</h4>
                        <p>₹ {calculateGrandTotal().toFixed(2)}</p>
                    </div>
                </div>

                {/* ── Form Actions ── */}
                <div className="q-form-actions">
                    <div className="q-status-buttons">
                        <button type="button" className="create-o-btn" onClick={handleCreateOrder}>
                            Create Order
                        </button>
                        <button type="button" className="close-btn" onClick={handleCloseQuote}>
                            Close Quote
                        </button>
                        <button type="button" className="generate-btn" onClick={() => generateQuotePdf({
                            ...formData, quote_id: id, products, total_amount: calculateGrandTotal()
                        })}>
                            Generate Quote PDF
                        </button>
                    </div>

                    <div className="q-action-buttons">
                        <button type="button" className="cancel-btn" onClick={() => navigate("/quotes")}>
                            Cancel
                        </button>
                        <button type="button" className="qt-save-btn" onClick={handleUpdate}>
                            Update Quote
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Product Modal ── */}
            {showProductModal && (
                <div className="modal-overlay">
                    <div className="product-modal">
                        <div className="modal-header">
                            <h3>{editingIndex !== null ? "Edit Product" : "Add Product"}</h3>
                            <button type="button" className="close-btn" onClick={() => setShowProductModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <label>Select Product *</label>
                                <select
                                    value={productForm.product_id}
                                    onChange={(e) => {
                                        const selected = allProducts.find(p => p.product_id === Number(e.target.value));
                                        setProductForm(prev => ({
                                            ...prev,
                                            product_id: e.target.value,
                                            product_name: selected?.product_name || "",
                                            price_per_unit: selected?.list_price || 0
                                        }));
                                    }}
                                >
                                    <option value="">Select Product</option>
                                    {allProducts.map(product => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Unit of Measure</label>
                                <select
                                    value={productForm.unit_of_measure}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                                >
                                    <option value="PCS">PCS</option>
                                    <option value="KG">KG</option>
                                    <option value="LIT">LITER</option>
                                    <option value="BOX">BOX</option>
                                    <option value="PKT">PACK</option>
                                </select>
                            </div>
                            <div className="form-row-double">
                                <div className="form-row">
                                    <label>Price Per Unit *</label>
                                    <input type="number" value={productForm.price_per_unit} readOnly />
                                </div>
                                <div className="form-row">
                                    <label>Quantity *</label>
                                    <input type="number" value={productForm.quantity} onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-row-double">
                                <div className="form-row">
                                    <label>Discount</label>
                                    <input type="number" value={productForm.manual_discount} onChange={(e) => setProductForm(prev => ({ ...prev, manual_discount: e.target.value }))} />
                                </div>
                                <div className="form-row">
                                    <label>Tax Amount</label>
                                    <input type="number" value={productForm.tax_amount} onChange={(e) => setProductForm(prev => ({ ...prev, tax_amount: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="modal-cancel-btn" onClick={() => setShowProductModal(false)}>Cancel</button>
                            <button type="button" className="modal-save-btn" onClick={saveProduct}>
                                {editingIndex !== null ? "Update Product" : "Add Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                CONFIRM MODAL
            ══════════════════════════════════════ */}
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

export default EditQuotes;