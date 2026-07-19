import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPen, FaTrash } from 'react-icons/fa';

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

import { createInvoiceFromOrder } from "../services/invoiceService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getOrderById, updateOrder } from "../services/orderService";
import { getProducts } from "../services/productsService";
import "../css/EditOrder.css";

function EditOrder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    const [confirmModal, setConfirmModal] = useState(null);
    const [alertModal, setAlertModal] = useState(null);

    const [productForm, setProductForm] = useState({
        product_id: "",
        product_name: "",
        unit_of_measure: "PCS",
        price_per_unit: 0,
        quantity: 0,
        manual_discount: 0,
        tax_amount: 0
    });

    useEffect(() => { fetchOrder(); loadProducts(); }, []);

    const fetchOrder = async () => {
        try {
            const data = await getOrderById(id);
            setOrder(data);
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to load order", err);
            showAlert("error", "Failed", "Failed to load order. Please try again.");
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

    /* ─────────────── Helpers ─────────────── */
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));
    };

    /* ─────────────── Calculations ─────────────── */
    const calculateProductTotal = (p) =>
        Number(p.price_per_unit || 0) * Number(p.quantity || 0)
        - Number(p.manual_discount || 0)
        + Number(p.tax_amount || 0);

    const calculateGrandTotal = () =>
        products.reduce((sum, p) => sum + calculateProductTotal(p), 0);

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
        const exists = products.some(
            p => p.product_id === productForm.product_id && editingIndex === null
        );

        if (exists) {
            showAlert("warning", "Duplicate Product", "This product has already been added.");
            return;
        }

        const selectedProduct = allProducts.find(
            p => p.product_id === Number(productForm.product_id)
        );

        const productData = {
            ...productForm,
            product_id: Number(productForm.product_id),
            product_name: selectedProduct?.product_name || "",
            unit_of_measure: selectedProduct?.unit_of_measure || productForm.unit_of_measure
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
            price_per_unit: 0,
            quantity: 0,
            manual_discount: 0,
            tax_amount: 0
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

    /* ─────────────── Generate PDF ─────────────── */
    const handleGeneratePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Order Report: ${order.order_code}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Topic: ${order.topic}`, 14, 25);
        doc.text(`Status: ${order.status}`, 14, 31);

        autoTable(doc, {
            startY: 40,
            head: [["Product", "Unit", "Price", "Qty", "Discount", "Tax", "Total"]],
            body: products.map(p => {
                const amount = Number(p.price_per_unit || 0) * Number(p.quantity || 0);
                const total = amount - Number(p.manual_discount || 0) + Number(p.tax_amount || 0);
                return [p.product_name, p.unit_of_measure, p.price_per_unit, p.quantity, p.manual_discount, p.tax_amount, total.toFixed(2)];
            })
        });

        doc.save(`order-${order.order_code}.pdf`);
    };

    /* ─────────────── Create Invoice ─────────────── */
    const handleCreateInvoice = () => {


        // Check if invoice already exists
        if (order.status === "Invoiced") {
            showAlert(
                "warning",
                "Invoice Already Exists",
                "An invoice has already been created for this order."
            );
            return;
        }


        if (!products || products.length === 0) {
            showAlert("warning", "Missing Product", "At least one product is required to create an invoice.");
            return;
        }
        setConfirmModal({
            title: "Create Invoice?",
            message: "Are you sure you want to create an invoice from this order?",
            confirmText: "Create Invoice",
            confirmClass: "confirm-modal-won-btn",
            icon: "paid",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const payload = {
                        order_id: id,
                        topic: order.topic,
                        account_id: order.account_id,
                        due_date: order.requested_delivery,
                        payment_terms: order.payment_terms,
                        shipping_method: order.shipping_method,
                        bill_to_street_1: order.bill_to_street_1,
                        bill_to_street_2: order.bill_to_street_2,
                        bill_to_street_3: order.bill_to_street_3,
                        bill_to_city: order.bill_to_city,
                        bill_to_state: order.bill_to_state,
                        bill_to_zip: order.bill_to_zip,
                        bill_to_country: order.bill_to_country,
                        ship_to_street_1: order.ship_to_street_1,
                        ship_to_street_2: order.ship_to_street_2,
                        ship_to_street_3: order.ship_to_street_3,
                        ship_to_city: order.ship_to_city,
                        ship_to_state: order.ship_to_state,
                        ship_to_zip: order.ship_to_zip,
                        ship_to_country: order.ship_to_country,
                        detail_amount: products.reduce((sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 0), 0),
                        total_discount: products.reduce((sum, p) => sum + Number(p.manual_discount || 0), 0),
                        total_tax: products.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0),
                        total_amount: calculateGrandTotal(),
                        products
                    };

                    await createInvoiceFromOrder(payload);
                    showAlert("success", "Invoice Created", "Invoice created successfully.", () => {
                        setAlertModal(null);
                        navigate("/invoices");
                    });
                } catch (err) {
                    console.error("Invoice creation failed", err);
                    showAlert("error", "Failed", "Failed to create invoice. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Close Order ─────────────── */
    const handleCloseOrder = () => {
        setConfirmModal({
            title: "Close Order?",
            message: "Are you sure you want to close this order? This action cannot be undone.",
            confirmText: "Close Order",
            confirmClass: "confirm-modal-delete-btn",
            icon: "close",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const updatedOrder = {
                        ...order,
                        status: "Canceled",
                        detail_amount: products.reduce((sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 0), 0),
                        total_discount: products.reduce((sum, p) => sum + Number(p.manual_discount || 0), 0),
                        total_tax: products.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0),
                        total_amount: calculateGrandTotal(),
                        products
                    };

                    await updateOrder(id, updatedOrder);
                    showAlert("success", "Order Closed", "Order has been closed successfully.", () => {
                        setAlertModal(null);
                        navigate("/orders");
                    });
                } catch (err) {
                    console.error("Close order failed", err);
                    showAlert("error", "Failed", "Failed to close order. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Validation ─────────────── */
    const validateOrder = () => {
        const errors = {};

        if (!order.topic?.trim()) errors.topic = "Topic is required";
        if (!order.account_id) errors.account_id = "Account is required";
        if (!order.status) errors.status = "Status is required";
        if (!order.payment_terms) errors.payment_terms = "Payment terms are required";
        if (!order.shipping_method) errors.shipping_method = "Shipping method is required";

        if (!products || products.length === 0) {
            errors.products = "At least one product is required";
        }

        const productErrors = [];
        products.forEach((p, index) => {
            const rowErrors = {};
            if (!p.product_id) rowErrors.product_id = "Product is required";
            if (!p.quantity || Number(p.quantity) <= 0) rowErrors.quantity = "Quantity must be greater than 0";
            if (p.quantity > 100000) rowErrors.quantity = "Quantity exceeds system limit";
            if (p.price_per_unit === "" || p.price_per_unit == null) rowErrors.price_per_unit = "Price is required";
            if (Number(p.price_per_unit) < 0) rowErrors.price_per_unit = "Price cannot be negative";
            if (Number(p.manual_discount) < 0) rowErrors.manual_discount = "Discount cannot be negative";
            if (Number(p.tax_amount) < 0) rowErrors.tax_amount = "Tax cannot be negative";
            if (Object.keys(rowErrors).length > 0) productErrors.push({ index, errors: rowErrors });
        });

        if (productErrors.length > 0) errors.productErrors = productErrors;

        return errors;
    };

    /* ─────────────── Submit ─────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateOrder();

        if (Object.keys(errors).length > 0) {
            const messages = Object.entries(errors)
                .filter(([key]) => key !== "productErrors")
                .map(([, val]) => val);

            if (errors.productErrors) {
                errors.productErrors.forEach(({ index, errors: rowErrors }) => {
                    Object.values(rowErrors).forEach((msg) => {
                        messages.push(`Row ${index + 1}: ${msg}`);
                    });
                });
            }

            showAlert("warning", "Please Fix the Following", messages.join("\n"));
            return;
        }

        try {
            await updateOrder(id, {
                ...order,
                detail_amount: products.reduce((sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 0), 0),
                total_discount: products.reduce((sum, p) => sum + Number(p.manual_discount || 0), 0),
                total_tax: products.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0),
                total_amount: calculateGrandTotal(),
                products
            });

            showAlert("success", "Order Updated", "Order updated successfully.", () => {
                setAlertModal(null);
                navigate("/orders");
            });
        } catch (err) {
            console.error("Update failed", err);
            showAlert("error", "Update Failed", "Failed to update order. Please try again.");
        }
    };

    /* ─────────────── Loading / Not Found ─────────────── */
    if (loading) return (
        <div className="order-edit-layout">
            <Sidebar />
            <div className="order-edit-content">
                <Topbar title="Edit Order" />
                <p style={{ padding: "20px" }}>Loading...</p>
            </div>
        </div>
    );

    if (!order) return <p>No order found</p>;

    /* ─────────────── Render ─────────────── */
    return (
        <div className="order-edit-layout">
            <Sidebar />

            <div className="order-edit-content">
                <Topbar title="Edit Order" />

                <form onSubmit={handleSubmit}>

                    {/* ── Order Details ── */}
                    <div className="order-card">
                        <h3 className="order-section-title">Order Details</h3>
                        <div className="order-form-grid">

                            <div className="order-form-group">
                                <label>Order Code</label>
                                <input name="order_code" value={order.order_code || ""} disabled />
                            </div>

                            <div className="order-form-group">
                                <label>Topic <span className="imp">*</span></label>
                                <input name="topic" value={order.topic || ""} onChange={handleChange} placeholder="Enter Topic" />
                            </div>

                            <div className="order-form-group">
                                <label>Requested Delivery</label>
                                <input name="requested_delivery" type="date" value={order.requested_delivery?.split("T")[0] || ""} onChange={handleChange} />
                            </div>

                            <div className="order-form-group">
                                <label>Status <span className="imp">*</span></label>
                                <select name="status" value={order.status || ""} onChange={handleChange}>
                                    <option value="Active">Active</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Canceled">Canceled</option>
                                    <option value="Invoiced">Invoiced</option>
                                </select>
                            </div>

                            <div className="order-form-group">
                                <label>Payment Terms <span className="imp">*</span></label>
                                <select name="payment_terms" value={order.payment_terms || ""} onChange={handleChange}>
                                    <option value="">Select Payment Terms</option>
                                    <option value="Net 25">Net 25</option>
                                    <option value="Net 50">Net 50</option>
                                    <option value="Net 75">Net 75</option>
                                    <option value="Net 100">Net 100</option>
                                </select>
                            </div>

                            <div className="order-form-group">
                                <label>Shipping Method <span className="imp">*</span></label>
                                <select name="shipping_method" value={order.shipping_method || ""} onChange={handleChange}>
                                    <option value="">Select Shipping Method</option>
                                    <option value="DHL">DHL</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="UPS">UPS</option>
                                    <option value="Airborne">Airborne</option>
                                    <option value="Postal Mail">Postal Mail</option>
                                    <option value="Full Load">Full Load</option>
                                    <option value="Will Call">Will Call</option>
                                </select>
                            </div>

                            <div className="order-form-group col-span-2">
                                <label>Total Amount</label>
                                <input value={calculateGrandTotal().toFixed(2)} disabled />
                            </div>

                        </div>
                    </div>

                    {/* ── Billing Address ── */}
                    <div className="order-card">
                        <h3 className="order-section-title">Billing Address</h3>
                        <div className="order-form-grid">
                            <div className="order-form-group">
                                <label>Bill To Street 1</label>
                                <input name="bill_to_street_1" value={order.bill_to_street_1 || ""} onChange={handleChange} placeholder="Enter Street 1" />
                            </div>
                            <div className="order-form-group">
                                <label>Bill To Street 2</label>
                                <input name="bill_to_street_2" value={order.bill_to_street_2 || ""} onChange={handleChange} placeholder="Enter Street 2" />
                            </div>
                            <div className="order-form-group col-span-2">
                                <label>Bill To Street 3</label>
                                <input name="bill_to_street_3" value={order.bill_to_street_3 || ""} onChange={handleChange} placeholder="Enter Street 3" />
                            </div>
                            <div className="order-form-group">
                                <label>Bill To City</label>
                                <input name="bill_to_city" value={order.bill_to_city || ""} onChange={handleChange} placeholder="Enter City" />
                            </div>
                            <div className="order-form-group">
                                <label>Bill To State</label>
                                <input name="bill_to_state" value={order.bill_to_state || ""} onChange={handleChange} placeholder="Enter State" />
                            </div>
                            <div className="order-form-group">
                                <label>Bill To Zip</label>
                                <input name="bill_to_zip" value={order.bill_to_zip || ""} onChange={handleChange} placeholder="Enter Zip" />
                            </div>
                            <div className="order-form-group">
                                <label>Bill To Country</label>
                                <input name="bill_to_country" value={order.bill_to_country || ""} onChange={handleChange} placeholder="Enter Country" />
                            </div>
                        </div>
                    </div>

                    {/* ── Shipping Address ── */}
                    <div className="order-card">
                        <h3 className="order-section-title">Shipping Address</h3>
                        <div className="order-form-grid">
                            <div className="order-form-group">
                                <label>Ship To Street 1</label>
                                <input name="ship_to_street_1" value={order.ship_to_street_1 || ""} onChange={handleChange} placeholder="Enter Street 1" />
                            </div>
                            <div className="order-form-group">
                                <label>Ship To Street 2</label>
                                <input name="ship_to_street_2" value={order.ship_to_street_2 || ""} onChange={handleChange} placeholder="Enter Street 2" />
                            </div>
                            <div className="order-form-group col-span-2">
                                <label>Ship To Street 3</label>
                                <input name="ship_to_street_3" value={order.ship_to_street_3 || ""} onChange={handleChange} placeholder="Enter Street 3" />
                            </div>
                            <div className="order-form-group">
                                <label>Ship To City</label>
                                <input name="ship_to_city" value={order.ship_to_city || ""} onChange={handleChange} placeholder="Enter City" />
                            </div>
                            <div className="order-form-group">
                                <label>Ship To State</label>
                                <input name="ship_to_state" value={order.ship_to_state || ""} onChange={handleChange} placeholder="Enter State" />
                            </div>
                            <div className="order-form-group">
                                <label>Ship To Zip</label>
                                <input name="ship_to_zip" value={order.ship_to_zip || ""} onChange={handleChange} placeholder="Enter Zip" />
                            </div>
                            <div className="order-form-group">
                                <label>Ship To Country</label>
                                <input name="ship_to_country" value={order.ship_to_country || ""} onChange={handleChange} placeholder="Enter Country" />
                            </div>
                        </div>
                    </div>

                    {/* ── Products ── */}
                    <div className="order-card">
                        <div className="order-section-header">
                            <h3>Products</h3>
                            <button type="button" className="order-add-btn" onClick={openAddProductModal}>
                                Add Product
                            </button>
                        </div>

                        <table className="order-products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Unit</th>
                                    <th>Price/Unit</th>
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
                                        <td colSpan="9" className="order-no-data">No products added</td>
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
                                                    <div className="order-table-actions">
                                                        <button type="button" className="order-icon-btn edit" onClick={() => editProduct(index)}><FaPen /></button>
                                                        <button type="button" className="order-icon-btn delete" onClick={() => deleteProduct(index)}><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Amount Summary ── */}
                    <div className="order-summary-section">
                        <div className="order-summary-card">
                            <h4>Total Products</h4>
                            <p>{products.length}</p>
                        </div>
                        <div className="order-summary-card">
                            <h4>Subtotal</h4>
                            <p>₹ {products.reduce((sum, p) => sum + Number(p.price_per_unit || 0) * Number(p.quantity || 0), 0).toFixed(2)}</p>
                        </div>
                        <div className="order-summary-card">
                            <h4>Total Discount</h4>
                            <p>₹ {products.reduce((sum, p) => sum + Number(p.manual_discount || 0), 0).toFixed(2)}</p>
                        </div>
                        <div className="order-summary-card">
                            <h4>Total Tax</h4>
                            <p>₹ {products.reduce((sum, p) => sum + Number(p.tax_amount || 0), 0).toFixed(2)}</p>
                        </div>
                        <div className="order-summary-card order-grand-total-card">
                            <h4>Grand Total</h4>
                            <p>₹ {calculateGrandTotal().toFixed(2)}</p>
                        </div>
                    </div>

                    {/* ── Form Actions ── */}
                    <div className="order-form-actions">
                        <div className="order-modal-actions-left">
                            <button type="button" onClick={handleCreateInvoice} className="create-in">
                                Create Invoice
                            </button>
                            <button type="button" onClick={handleCloseOrder} className="close-order">
                                Close Order
                            </button>
                            <button type="button" onClick={handleGeneratePDF} className="gen-pdf">
                                Generate PDF
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="button" className="order-cancel-btn" onClick={() => navigate("/orders")}>
                                Cancel
                            </button>
                            <button type="submit" className="order-save-btn">
                                Update Order
                            </button>
                        </div>
                    </div>

                </form>
            </div>

            {/* ── Product Modal ── */}
            {showProductModal && (
                <div className="modal-overlay">
                    <div className="order-modal">
                        <div className="order-modal-header">
                            <h3>{editingIndex !== null ? "Edit Product" : "Add Product"}</h3>
                            <button type="button" className="order-modal-close" onClick={() => setShowProductModal(false)}>×</button>
                        </div>
                        <div className="order-modal-body">
                            <div className="order-modal-field">
                                <label>Select Product <span className="imp">*</span></label>
                                <select value={productForm.product_id} onChange={(e) => {
                                    const selected = allProducts.find(p => p.product_id === Number(e.target.value));
                                    setProductForm(prev => ({
                                        ...prev,
                                        product_id: e.target.value,
                                        product_name: selected?.product_name || "",
                                        unit_of_measure: selected?.unit_of_measure || "PCS",
                                        price_per_unit: selected?.list_price || 0
                                    }));
                                }}>
                                    <option value="">Select Product</option>
                                    {allProducts.map(product => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="order-modal-field">
                                <label>Unit of Measure <span className="imp">*</span></label>
                                <select value={productForm.unit_of_measure} onChange={(e) => setProductForm(prev => ({ ...prev, unit_of_measure: e.target.value }))}>
                                    <option value="PCS">PCS</option>
                                    <option value="KG">KG</option>
                                    <option value="LIT">LITER</option>
                                    <option value="BOX">BOX</option>
                                    <option value="PKT">PACK</option>
                                </select>
                            </div>
                            <div className="order-modal-row-double">
                                <div className="order-modal-field">
                                    <label>Price Per Unit <span className="imp">*</span></label>
                                    <input type="number" value={productForm.price_per_unit} onChange={(e) => setProductForm(prev => ({ ...prev, price_per_unit: e.target.value }))} />
                                </div>
                                <div className="order-modal-field">
                                    <label>Quantity <span className="imp">*</span></label>
                                    <input type="number" value={productForm.quantity} onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="order-modal-row-double">
                                <div className="order-modal-field">
                                    <label>Discount</label>
                                    <input type="number" value={productForm.manual_discount} onChange={(e) => setProductForm(prev => ({ ...prev, manual_discount: e.target.value }))} />
                                </div>
                                <div className="order-modal-field">
                                    <label>Tax Amount</label>
                                    <input type="number" value={productForm.tax_amount} onChange={(e) => setProductForm(prev => ({ ...prev, tax_amount: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="order-modal-footer">
                            <button type="button" className="order-cancel-btn" onClick={() => setShowProductModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="order-save-btn" onClick={saveProduct}>
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

export default EditOrder;