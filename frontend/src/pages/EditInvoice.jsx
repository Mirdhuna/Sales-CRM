import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPen, FaTrash } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

import jsPDF from "jspdf";
import { getInvoiceById, updateInvoice } from "../services/invoiceService";
import { getProducts } from "../services/productsService";
import "../css/EditInvoice.css";

function EditInvoice() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showProductModal, setShowProductModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    // ── Modal states ──
    const [confirmModal, setConfirmModal] = useState(null);
    const [alertModal, setAlertModal] = useState(null);
    // alertModal shape: { type: "success"|"error"|"warning", title, message, onClose }

    const emptyProductForm = {
        product_id: "",
        product_name: "",
        unit_of_measure: "PCS",
        price_per_unit: 0,
        quantity: 0,
        manual_discount: 0,
        tax_amount: 0
    };

    const [productForm, setProductForm] = useState(emptyProductForm);

    useEffect(() => {
        loadInvoice();
        loadAllProducts();
    }, []);

    const loadInvoice = async () => {
        try {
            const data = await getInvoiceById(id);
            setInvoice(data);
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to load invoice", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllProducts = async () => {
        try {
            const data = await getProducts();
            setAllProducts(data);
        } catch (err) {
            console.error("Failed to load products", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoice((prev) => ({ ...prev, [name]: value }));
    };

    /* ─────────────── Helpers ─────────────── */
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    /* ─────────────── Calculations ─────────────── */
    const toNum = (v) => Number(v || 0);

    const calcLineTotal = (p) =>
        toNum(p.price_per_unit) * toNum(p.quantity)
        - toNum(p.manual_discount)
        + toNum(p.tax_amount);

    const calcSubtotal = () => products.reduce((s, p) => s + toNum(p.price_per_unit) * toNum(p.quantity), 0);
    const calcTotalDiscount = () => products.reduce((s, p) => s + toNum(p.manual_discount), 0);
    const calcTotalTax = () => products.reduce((s, p) => s + toNum(p.tax_amount), 0);
    const calcGrandTotal = () => products.reduce((s, p) => s + calcLineTotal(p), 0);

    /* ─────────────── Product Modal ─────────────── */
    const openAddProductModal = () => {
        setEditingIndex(null);
        setProductForm(emptyProductForm);
        setShowProductModal(true);
    };

    const saveProduct = () => {
        if (!productForm.product_id) {
            showAlert("warning", "Product Required", "Please select a product before adding.");
            return;
        }

        const alreadyExists = products.some(
            (p) => p.product_id === Number(productForm.product_id) && editingIndex === null
        );
        if (alreadyExists) {
            showAlert("warning", "Duplicate Product", "This product has already been added.");
            return;
        }

        const selectedProduct = allProducts.find(
            (p) => p.product_id === Number(productForm.product_id)
        );

        const productData = {
            ...productForm,
            product_id: Number(productForm.product_id),
            product_name: selectedProduct?.product_name || productForm.product_name,
            unit_of_measure: productForm.unit_of_measure || selectedProduct?.unit_of_measure || "PCS"
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
        setProductForm(emptyProductForm);
    };

    const editProduct = (index) => {
        setEditingIndex(index);
        setProductForm(products[index]);
        setShowProductModal(true);
    };

    const deleteProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    /* ─────────────── Validation ─────────────── */
    const validateInvoice = () => {
        const errors = {};

        if (!invoice.topic?.trim()) errors.topic = "Topic is required";
        if (!invoice.status) errors.status = "Status is required";
        if (!invoice.payment_terms) errors.payment_terms = "Payment terms are required";
        if (!invoice.shipping_method) errors.shipping_method = "Shipping method is required";
        if (!invoice.due_date) errors.due_date = "Due date is required";

        if (invoice.date_delivered && invoice.due_date) {
            const delivery = new Date(invoice.date_delivered);
            const due = new Date(invoice.due_date);
            if (delivery > due) {
                errors.date_delivered = "Delivery date cannot be after the due date";
            }
        }

        if (!products || products.length === 0) {
            errors.products = "At least one product is required";
        }

        const productErrors = [];
        products.forEach((p, i) => {
            const row = {};
            if (!p.product_id) row.product_id = "Product required";
            if (!p.quantity || Number(p.quantity) <= 0) row.quantity = "Quantity must be > 0";
            if (Number(p.quantity) > 100000) row.quantity = "Quantity too large";
            if (p.price_per_unit === "" || p.price_per_unit == null) row.price_per_unit = "Price required";
            if (Number(p.price_per_unit) < 0) row.price_per_unit = "Price cannot be negative";
            if (Number(p.manual_discount) < 0) row.manual_discount = "Discount cannot be negative";
            if (Number(p.tax_amount) < 0) row.tax_amount = "Tax cannot be negative";
            const lineTotal = Number(p.price_per_unit || 0) * Number(p.quantity || 0);
            if (Number(p.manual_discount) > lineTotal) row.manual_discount = "Discount cannot exceed line amount";
            if (Object.keys(row).length > 0) productErrors.push({ index: i, errors: row });
        });

        if (productErrors.length > 0) errors.productErrors = productErrors;

        return errors;
    };

    /* ─────────────── Update Invoice ─────────────── */
    const handleUpdateInvoice = async () => {
        const errors = validateInvoice();

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
            const payload = {
                topic: invoice.topic,
                status: invoice.status,
                currency: invoice.currency || "INR",
                due_date: invoice.due_date,
                date_delivered: invoice.date_delivered || null,
                payment_terms: invoice.payment_terms,
                shipping_method: invoice.shipping_method,
                bill_to_street_1: invoice.bill_to_street_1,
                bill_to_street_2: invoice.bill_to_street_2,
                bill_to_street_3: invoice.bill_to_street_3,
                bill_to_city: invoice.bill_to_city,
                bill_to_state: invoice.bill_to_state,
                bill_to_zip: invoice.bill_to_zip,
                bill_to_country: invoice.bill_to_country,
                ship_to_street_1: invoice.ship_to_street_1,
                ship_to_street_2: invoice.ship_to_street_2,
                ship_to_street_3: invoice.ship_to_street_3,
                ship_to_city: invoice.ship_to_city,
                ship_to_state: invoice.ship_to_state,
                ship_to_zip: invoice.ship_to_zip,
                ship_to_country: invoice.ship_to_country,
                detail_amount: calcSubtotal(),
                total_discount: calcTotalDiscount(),
                total_tax: calcTotalTax(),
                total_amount: calcGrandTotal(),
                products
            };

            await updateInvoice(id, payload);
            showAlert("success", "Invoice Updated", "Invoice has been updated successfully.", () => {
                setAlertModal(null);
                navigate("/invoices");
            });
        } catch (err) {
            console.error("Update failed", err);
            showAlert("error", "Update Failed", "Something went wrong while updating the invoice. Please try again.");
        }
    };

    /* ─────────────── Close Invoice ─────────────── */
    const handleCloseInvoice = () => {
        setConfirmModal({
            title: "Close Invoice?",
            message: "Are you sure you want to close this invoice? This action cannot be undone.",
            confirmText: "Close Invoice",
            confirmClass: "confirm-modal-delete-btn",
            icon: "close",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const payload = {
                        ...invoice,
                        status: "Canceled",
                        detail_amount: calcSubtotal(),
                        total_discount: calcTotalDiscount(),
                        total_tax: calcTotalTax(),
                        total_amount: calcGrandTotal(),
                        products
                    };
                    await updateInvoice(id, payload);
                    showAlert("success", "Invoice Closed", "The invoice has been closed successfully.", () => {
                        setAlertModal(null);
                        navigate("/invoices");
                    });
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", "Could not close the invoice. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Mark as Paid ─────────────── */
    const handleMarkAsPaid = () => {


        if (!invoice.due_date) {
            showAlert("warning", "Due Date Missing", "Please set a due date on the invoice before marking as Paid.");
            return;
        }

        if (!invoice.date_delivered) {
            showAlert("warning", "Delivery Date Missing", "Please fill in the Date Delivered field before marking as Paid.");
            return;
        }

        if (invoice.status==="Paid"){
            showAlert("warning","Already Paid","The amount has already been paid");
            return;
        }
        const delivery = new Date(invoice.date_delivered);
        const due = new Date(invoice.due_date);
        if (delivery > due) {
            showAlert("warning", "Invalid Dates", "Delivery date cannot be after the due date. Please check the dates.");
            return;
        }
        if (!products || products.length === 0) {
            showAlert("warning", "Missing Product", "At least one product is required to mark the invoice paid.");
            return;
        }

        setConfirmModal({
            title: "Mark as Paid?",
            message: `Are you sure you want to mark this invoice as Paid? The delivery date will be set to ${invoice.date_delivered?.split("T")[0]}.`,
            confirmText: "Mark as Paid",
            confirmClass: "confirm-modal-paid-btn",
            icon: "paid",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const payload = {
                        ...invoice,
                        status: "Paid",
                        date_delivered: invoice.date_delivered?.split("T")[0],
                        detail_amount: calcSubtotal(),
                        total_discount: calcTotalDiscount(),
                        total_tax: calcTotalTax(),
                        total_amount: calcGrandTotal(),
                        products
                    };
                    await updateInvoice(id, payload);
                    showAlert("success", "Invoice Paid", "Invoice has been marked as Paid successfully.", () => {
                        setAlertModal(null);
                        navigate("/invoices");
                    });
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Failed", "Could not mark invoice as Paid. Please try again.");
                }
            }
        });
    };

    /* ─────────────── Generate PDF ─────────────── */
    const handleGeneratePdf = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("INVOICE", 90, 20);
        doc.setFontSize(12);
        doc.text(`Invoice No: ${invoice.invoice_code}`, 20, 40);
        doc.text(`Status: ${invoice.status}`, 20, 50);
        doc.text(`Due Date: ${invoice.due_date?.split("T")[0] || ""}`, 20, 60);
        doc.text("Billing Address", 20, 80);
        doc.text(invoice.bill_to_street_1 || "", 20, 90);
        doc.text(invoice.bill_to_city || "", 20, 100);
        doc.text(invoice.bill_to_country || "", 20, 110);
        let y = 130;
        doc.text("Products", 20, y);
        y += 10;
        products.forEach((p) => {
            doc.text(`${p.product_name} | Qty: ${p.quantity} | ₹${p.price_per_unit}`, 20, y);
            y += 10;
        });
        y += 10;
        doc.text(`Subtotal: ₹${calcSubtotal().toFixed(2)}`, 20, y); y += 10;
        doc.text(`Tax: ₹${calcTotalTax().toFixed(2)}`, 20, y); y += 10;
        doc.text(`Discount: ₹${calcTotalDiscount().toFixed(2)}`, 20, y); y += 10;
        doc.text(`Grand Total: ₹${calcGrandTotal().toFixed(2)}`, 20, y);
        doc.save(`${invoice.invoice_code}.pdf`);
    };

    /* ─────────────── Loading / Not Found ─────────────── */
    if (loading) return (
        <div className="inv-layout">
            <Sidebar />
            <div className="inv-content">
                <Topbar title="Edit Invoice" />
                <p className="inv-loading">Loading...</p>
            </div>
        </div>
    );

    if (!invoice) return <p className="inv-loading">No invoice found</p>;

    /* ─────────────── Render ─────────────── */
    return (
        <div className="inv-layout">
            <Sidebar />

            <div className="inv-content">
                <Topbar title="Edit Invoice" />

                {/* ══════════════════════════════════════
                    INVOICE DETAILS
                ══════════════════════════════════════ */}
                <div className="inv-card">
                    <h3 className="inv-section-title">Invoice Details</h3>
                    <div className="inv-grid">

                        <div className="inv-field">
                            <label>Invoice Code</label>
                            <input value={invoice.invoice_id || ""} disabled />
                        </div>

                        <div className="inv-field">
                            <label>Topic <span className="imp">*</span></label>
                            <input name="topic" value={invoice.topic || ""} onChange={handleChange} placeholder="Enter Topic" />
                        </div>

                        <div className="inv-field">
                            <label>Status <span className="imp">*</span></label>
                            <select name="status" value={invoice.status || ""} onChange={handleChange}>
                                <option value="Active">Active</option>
                                <option value="Paid">Paid</option>
                                <option value="Canceled">Canceled</option>
                            </select>
                        </div>

                        <div className="inv-field">
                            <label>Currency <span className="imp">*</span></label>
                            <select name="currency" value={invoice.currency || "INR"} onChange={handleChange}>
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        <div className="inv-field">
                            <label>Due Date <span className="imp">*</span></label>
                            <input type="date" name="due_date" value={invoice.due_date?.split("T")[0] || ""} onChange={handleChange} />
                        </div>

                        <div className="inv-field">
                            <label>Date Delivered</label>
                            <input type="date" name="date_delivered" value={invoice.date_delivered?.split("T")[0] || ""} onChange={handleChange} />
                        </div>

                        <div className="inv-field">
                            <label>Payment Terms <span className="imp">*</span></label>
                            <select name="payment_terms" value={invoice.payment_terms || ""} onChange={handleChange}>
                                <option value="">Select Payment Term</option>
                                <option value="Net 25">Net 25</option>
                                <option value="Net 50">Net 50</option>
                                <option value="Net 75">Net 75</option>
                                <option value="Net 100">Net 100</option>
                            </select>
                        </div>

                        <div className="inv-field">
                            <label>Shipping Method <span className="imp">*</span></label>
                            <select name="shipping_method" value={invoice.shipping_method || ""} onChange={handleChange}>
                                <option value="">Select Shipping Method</option>
                                <option value="DHL">DHL</option>
                                <option value="FedEx">FedEx</option>
                                <option value="UPS">UPS</option>
                                <option value="Airborne">Airborne</option>
                                <option value="Postal Mail">Postal Mail</option>
                            </select>
                        </div>

                        <div className="inv-field inv-col-span-2">
                            <label>Total Amount</label>
                            <input value={`₹ ${calcGrandTotal().toFixed(2)}`} disabled />
                        </div>

                    </div>
                </div>

                {/* ══════════════════════════════════════
                    BILLING ADDRESS
                ══════════════════════════════════════ */}
                <div className="inv-card">
                    <h3 className="inv-section-title">Billing Address</h3>
                    <div className="inv-grid">
                        <div className="inv-field">
                            <label>Street 1</label>
                            <input name="bill_to_street_1" value={invoice.bill_to_street_1 || ""} onChange={handleChange} placeholder="Enter Street 1" />
                        </div>
                        <div className="inv-field">
                            <label>Street 2</label>
                            <input name="bill_to_street_2" value={invoice.bill_to_street_2 || ""} onChange={handleChange} placeholder="Enter Street 2" />
                        </div>
                        <div className="inv-field inv-col-span-2">
                            <label>Street 3</label>
                            <input name="bill_to_street_3" value={invoice.bill_to_street_3 || ""} onChange={handleChange} placeholder="Enter Street 3" />
                        </div>
                        <div className="inv-field">
                            <label>City</label>
                            <input name="bill_to_city" value={invoice.bill_to_city || ""} onChange={handleChange} placeholder="Enter City" />
                        </div>
                        <div className="inv-field">
                            <label>State</label>
                            <input name="bill_to_state" value={invoice.bill_to_state || ""} onChange={handleChange} placeholder="Enter State" />
                        </div>
                        <div className="inv-field">
                            <label>Zip</label>
                            <input name="bill_to_zip" value={invoice.bill_to_zip || ""} onChange={handleChange} placeholder="Enter Zip" />
                        </div>
                        <div className="inv-field">
                            <label>Country</label>
                            <input name="bill_to_country" value={invoice.bill_to_country || ""} onChange={handleChange} placeholder="Enter Country" />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    SHIPPING ADDRESS
                ══════════════════════════════════════ */}
                <div className="inv-card">
                    <h3 className="inv-section-title">Shipping Address</h3>
                    <div className="inv-grid">
                        <div className="inv-field">
                            <label>Street 1</label>
                            <input name="ship_to_street_1" value={invoice.ship_to_street_1 || ""} onChange={handleChange} placeholder="Enter Street 1" />
                        </div>
                        <div className="inv-field">
                            <label>Street 2</label>
                            <input name="ship_to_street_2" value={invoice.ship_to_street_2 || ""} onChange={handleChange} placeholder="Enter Street 2" />
                        </div>
                        <div className="inv-field inv-col-span-2">
                            <label>Street 3</label>
                            <input name="ship_to_street_3" value={invoice.ship_to_street_3 || ""} onChange={handleChange} placeholder="Enter Street 3" />
                        </div>
                        <div className="inv-field">
                            <label>City</label>
                            <input name="ship_to_city" value={invoice.ship_to_city || ""} onChange={handleChange} placeholder="Enter City" />
                        </div>
                        <div className="inv-field">
                            <label>State</label>
                            <input name="ship_to_state" value={invoice.ship_to_state || ""} onChange={handleChange} placeholder="Enter State" />
                        </div>
                        <div className="inv-field">
                            <label>Zip</label>
                            <input name="ship_to_zip" value={invoice.ship_to_zip || ""} onChange={handleChange} placeholder="Enter Zip" />
                        </div>
                        <div className="inv-field">
                            <label>Country</label>
                            <input name="ship_to_country" value={invoice.ship_to_country || ""} onChange={handleChange} placeholder="Enter Country" />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    PRODUCTS TABLE
                ══════════════════════════════════════ */}
                <div className="inv-card">
                    <div className="inv-section-header">
                        <h3 className="inv-section-title" style={{ marginBottom: 0 }}>Products</h3>
                    </div>
                    <div className="inv-table-wrap">
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Unit</th>
                                    <th>Price / Unit</th>
                                    <th>Qty</th>
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
                                        <td colSpan="9" className="inv-no-data">No products added yet</td>
                                    </tr>
                                ) : (
                                    products.map((p, index) => {
                                        const amount = toNum(p.price_per_unit) * toNum(p.quantity);
                                        const total = calcLineTotal(p);
                                        return (
                                            <tr key={index}>
                                                <td>{p.product_name}</td>
                                                <td>{p.unit_of_measure}</td>
                                                <td>{toNum(p.price_per_unit).toFixed(2)}</td>
                                                <td>{p.quantity}</td>
                                                <td>{amount.toFixed(2)}</td>
                                                <td>{toNum(p.manual_discount).toFixed(2)}</td>
                                                <td>{toNum(p.tax_amount).toFixed(2)}</td>
                                                <td><strong>{total.toFixed(2)}</strong></td>
                                                <td>
                                                    <div className="inv-table-actions">
                                                        <button type="button" className="inv-icon-btn edit" onClick={() => editProduct(index)}>
                                                            <FaPen />
                                                        </button>
                                                        <button type="button" className="inv-icon-btn delete" onClick={() => deleteProduct(index)}>
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    AMOUNT SUMMARY
                ══════════════════════════════════════ */}
                <div className="inv-summary-row">
                    <div className="inv-summary-card">
                        <span className="inv-summary-label">Total Products</span>
                        <span className="inv-summary-value">{products.length}</span>
                    </div>
                    <div className="inv-summary-card">
                        <span className="inv-summary-label">Subtotal</span>
                        <span className="inv-summary-value">₹ {calcSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="inv-summary-card">
                        <span className="inv-summary-label">Total Discount</span>
                        <span className="inv-summary-value">₹ {calcTotalDiscount().toFixed(2)}</span>
                    </div>
                    <div className="inv-summary-card">
                        <span className="inv-summary-label">Total Tax</span>
                        <span className="inv-summary-value">₹ {calcTotalTax().toFixed(2)}</span>
                    </div>
                    <div className="inv-summary-card inv-grand-total">
                        <span className="inv-summary-label">Grand Total</span>
                        <span className="inv-summary-value">₹ {calcGrandTotal().toFixed(2)}</span>
                    </div>
                </div>

                <br />

                {/* ══════════════════════════════════════
                    FORM ACTIONS
                ══════════════════════════════════════ */}
                <div className="inv-form-actions">
                    <div className="inv-left-actions">
                        <button type="button" className="inv-close-btn" onClick={handleMarkAsPaid}>
                            Mark as Paid
                        </button>
                        <button type="button" className="inv-pdf-btn" onClick={handleGeneratePdf}>
                            Generate PDF
                        </button>
                        <button type="button" className="inv-close-cancel-btn" onClick={handleCloseInvoice}>
                            Close Invoice
                        </button>
                    </div>

                    <br />

                    <div className="inv-right-actions">
                        <button type="button" className="inv-cancel-btn" onClick={() => navigate("/invoices")}>
                            Cancel
                        </button>
                        <button type="button" className="inv-save-btn" onClick={handleUpdateInvoice}>
                            Update Invoice
                        </button>
                    </div>
                </div>

            </div>

            {/* ══════════════════════════════════════
                PRODUCT MODAL
            ══════════════════════════════════════ */}
            {showProductModal && (
                <div className="inv-modal-overlay">
                    <div className="inv-modal">
                        <div className="inv-modal-header">
                            <h3>{editingIndex !== null ? "Edit Product" : "Add Product"}</h3>
                            <button type="button" className="inv-modal-close" onClick={() => setShowProductModal(false)}>×</button>
                        </div>
                        <div className="inv-modal-body">
                            <div className="inv-modal-field">
                                <label>Select Product <span className="imp">*</span></label>
                                <select
                                    value={productForm.product_id}
                                    onChange={(e) => {
                                        const selected = allProducts.find((p) => p.product_id === Number(e.target.value));
                                        setProductForm((prev) => ({
                                            ...prev,
                                            product_id: e.target.value,
                                            product_name: selected?.product_name || "",
                                            unit_of_measure: selected?.unit_of_measure || "PCS",
                                            price_per_unit: selected?.list_price || 0
                                        }));
                                    }}
                                >
                                    <option value="">-- Select a Product --</option>
                                    {allProducts.map((product) => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="inv-modal-field">
                                <label>Unit of Measure <span className="imp">*</span></label>
                                <select
                                    value={productForm.unit_of_measure}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, unit_of_measure: e.target.value }))}
                                >
                                    <option value="PCS">PCS</option>
                                    <option value="KG">KG</option>
                                    <option value="LIT">LITER</option>
                                    <option value="BOX">BOX</option>
                                    <option value="PKT">PACK</option>
                                </select>
                            </div>
                            <div className="inv-modal-row-double">
                                <div className="inv-modal-field">
                                    <label>Price Per Unit <span className="imp">*</span></label>
                                    <input type="number" min="0" value={productForm.price_per_unit}
                                        onChange={(e) => setProductForm((prev) => ({ ...prev, price_per_unit: e.target.value }))} />
                                </div>
                                <div className="inv-modal-field">
                                    <label>Quantity <span className="imp">*</span></label>
                                    <input type="number" min="0" value={productForm.quantity}
                                        onChange={(e) => setProductForm((prev) => ({ ...prev, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="inv-modal-row-double">
                                <div className="inv-modal-field">
                                    <label>Discount</label>
                                    <input type="number" min="0" value={productForm.manual_discount}
                                        onChange={(e) => setProductForm((prev) => ({ ...prev, manual_discount: e.target.value }))} />
                                </div>
                                <div className="inv-modal-field">
                                    <label>Tax Amount</label>
                                    <input type="number" min="0" value={productForm.tax_amount}
                                        onChange={(e) => setProductForm((prev) => ({ ...prev, tax_amount: e.target.value }))} />
                                </div>
                            </div>
                            <div className="inv-modal-line-total">
                                Line Total: <strong>
                                    ₹ {(
                                        toNum(productForm.price_per_unit) * toNum(productForm.quantity)
                                        - toNum(productForm.manual_discount)
                                        + toNum(productForm.tax_amount)
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                        <div className="inv-modal-footer">
                            <button type="button" className="inv-cancel-btn" onClick={() => setShowProductModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="inv-save-btn" onClick={saveProduct}>
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

export default EditInvoice;