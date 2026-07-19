import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPen, FaTrash } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getCompetitorsByProduct, getSelectedCompetitors, saveCompetitors } from "../services/compOppService";
import { updateOpportunity, getOpportunitiesById } from "../services/opportunitiesService";
import { getAccounts } from "../services/accountsService";
import { getContacts } from "../services/contactsService";
import { getProducts } from "../services/productsService";
import AlertModal from "../components/AlertModal";
import API from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import "../css/AddEditOpp.css";

function EditOpportunity() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const [showProductModal, setShowProductModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [products, setProducts] = useState([]);

    const [showCompetitorModal, setShowCompetitorModal] = useState(false);
    const [selectedOpportunityProduct, setSelectedOpportunityProduct] =
        useState(null);

    const [availableCompetitors, setAvailableCompetitors] = useState([]);
    const [selectedCompetitors, setSelectedCompetitors] = useState([]);

    const [showLostModal, setShowLostModal] = useState(false);
    const [lostCompetitorId, setLostCompetitorId] = useState("");

    const [productForm, setProductForm] = useState({
        product_id: "",
        product_name: "",
        unit_of_measure: "PCS",
        price_per_unit: 0,
        quantity: 0,
        manual_discount: 0,
        tax_amount: 0
    });

    const [formData, setFormData] = useState({
        topic: "",
        account_id: "",
        primary_contact_id: "",
        budget_amount: 0,
        purchase_timeframe: "Unknown",
        purchase_process: "Unknown",
        currency: "USD",
        description: "",
        customer_need: "",
        proposed_solution: "",
        status: "New"
    });

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const validateForm = () => {
        const errors = [];

        // CORE FIELDS
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
        // BUSINESS RULES
        if (formData.budget_amount && Number(formData.budget_amount) < 0) {
            errors.push("Budget cannot be negative");
        }

        // PRODUCTS VALIDATION (VERY IMPORTANT)
        if (!products || products.length === 0) {
            errors.push("At least one product is required");
        }

        // FIX: was unconditionally blocking saves with "Please select a competitor"
        // because lostCompetitorId starts as "". Now only validated when status is "Lost".
        if (formData.status === "Lost" && !lostCompetitorId) {
            showAlert(
                "warning",
                "Required",
                "Please select a competitor."
            );
            return;
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

    const openLostModal = async () => {
        try {
            const allCompetitors = [];

            for (const product of products) {
                const competitors = await getCompetitorsByProduct(product.product_id);
                allCompetitors.push(...competitors);
            }

            setAvailableCompetitors(allCompetitors);
            setShowLostModal(true);

        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Unable to load competitors.");
        }
    };
    const openCompetitorModal = async (product) => {
        try {
            setSelectedOpportunityProduct(product);
            const available = await getCompetitorsByProduct(product.product_id);
            const selected = await getSelectedCompetitors(id, product.product_id);
            setAvailableCompetitors(available);
            setSelectedCompetitors(selected.map((c) => c.competitor_product_id));
            setShowCompetitorModal(true);
        }
        catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Unable to load Competitors.");
        }
    };

    const toggleCompetitor = (competitorId) => {
        setSelectedCompetitors((prev) => {
            if (prev.includes(competitorId)) {
                return prev.filter((id) => id !== competitorId);
            }
            return [...prev, competitorId];
        })
    }

    const handleSaveCompetitors = async () => {
        try {

            await saveCompetitors(
                id,
                selectedOpportunityProduct.product_id,
                selectedCompetitors
            );

            showAlert(
                "success",
                "Updated",
                "Competitors updated successfully."
            );

            setShowCompetitorModal(false);

        } catch (err) {

            console.error(err);

            showAlert(
                "error",
                "Failed",
                "Failed to save competitors."
            );
        }
    };

    const confirmMarkWon = () => {
        setConfirmModal({
            title: "Mark Opportunity as Won?",
            message: "This will convert the opportunity into a quote. Do you want to continue?",
            confirmText: "Mark as Won",
            confirmClass: "confirm-modal-won-btn",
            icon: "paid",
            onConfirm: markWon,
        });
    };

    const markWon = async () => {
        setConfirmModal(null);

        // Prevent duplicate conversion
        if (formData.status === "Won") {
            showAlert(
                "warning",
                "Already Won",
                "This opportunity has already been marked as Won and converted to a Quote."
            );
            return;
        }
        if (!products || products.length === 0) {
            showAlert("warning", "Missing Product", "At least one product is required to mark this opportunity as Won.");
            return;
        }

        try {
            await updateOpportunity(id, { ...formData, products });

            await API.post(`/opportunities/${id}/won`);

            setFormData(prev => ({
                ...prev,
                status: "Won"
            }));

            showAlert(
                "success",
                "Converted",
                "Opportunity is converted to Quote",
                () => {
                    setAlertModal(null);
                    navigate("/quotes");
                }
            );

        } catch (err) {
            console.error(err);

            showAlert(
                "error",
                "Failed",
                "Failed to mark as Won"
            );
        }
    };

    const confirmMarkLost = () => {
        setConfirmModal({
            title: "Mark Opportunity as Lost?",
            message: "Are you sure you want to mark this opportunity as lost?",
            confirmText: "Mark as Lost",
            confirmClass: "confirm-modal-delete-btn",
            icon: "close",
            onConfirm: markLost,
        });
    };


    const markLost = async () => {
        setConfirmModal(null);

        try {
            await API.post(`/opportunities/${id}/lost`, {
                lost_to_competitor_product_id: lostCompetitorId
            });

            navigate("/opportunities");

        } catch (err) {
            console.error(err);

            showAlert(
                "error",
                "Failed",
                "Failed to mark as Lost"
            );
        }
    };

    useEffect(() => {
        loadAccounts();
        loadContacts();
        loadProducts();
        loadOpportunity();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            console.error(err);
        }
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

    const loadOpportunity = async () => {
        try {
            const data = await getOpportunitiesById(id);
            console.log("Opportunity Data:", data);
            setFormData({
                topic: data.topic || "",
                account_id: data.account_id || "",
                primary_contact_id: data.primary_contact_id || "",
                budget_amount: data.budget_amount || 0,
                purchase_timeframe: data.purchase_timeframe || "Unknown",
                purchase_process: data.purchase_process || "Unknown",
                currency: data.currency || "USD",
                description: data.description || "",
                customer_need: data.customer_need || "",
                proposed_solution: data.proposed_solution || "",
                status: data.status || "New"
            });
            setProducts(
                (data.products || []).map(p => ({
                    ...p,
                    price_per_unit: Number(p.price_per_unit || 0),
                    quantity: Number(p.quantity || 0),
                    manual_discount: Number(p.manual_discount || 0),
                    tax_amount: Number(p.tax_amount || 0)
                }))
            );
        }
        catch (err) {
            console.error(err);
        }
    }


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
            price_per_unit: 0,
            quantity: 0,
            manual_discount: 0,
            tax_amount: 0
        });

        setShowProductModal(true);
    };

    const saveProduct = () => {
        const selectedProduct = allProducts.find(
            (p) => p.product_id === Number(productForm.product_id)
        );

        const productData = {
            ...productForm,
            product_name: selectedProduct?.product_name || ""
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();

        if (errors.length > 0) {
            showAlert("warning", "Missing Fields", errors.join("\n"));
            return;
        }

        //console.log("FORM DATA");
        //console.log(formData);
        try {
            await updateOpportunity(id, {
                ...formData,
                products
            });

            showAlert("success", "updated", "Opportunity updated successfully!", () => {
                setAlertModal(null);
                navigate("/opportunities");
            });

        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to update opportunity.");
        }
    };

    const grandTotal = calculateGrandTotal();

    return (
        <div className="add-opportunity-layout">
            <Sidebar />

            <div className="add-opportunity-container">
                <Topbar title="Edit Opportunity" />

                <form onSubmit={handleSubmit}>
                    <div className="opportunity-card">


                        <div className="form-grid">

                            <div className="form-group">
                                <label>Topic <span className="imp">*</span></label>
                                <input
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    placeholder="Enter Topic"
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
                                    <option value="">Select Account *</option>

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
                                <label>Budget <span className="imp">*</span></label>

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
                                    <option value="">Select Purchase TimeFrame</option>
                                    <option value="Immediate">Immediate</option>
                                    <option value="This Quarter">
                                        This Quarter
                                    </option>
                                    <option value="Next Quarter">
                                        Next Quarter
                                    </option>
                                    <option value="This Year">
                                        This Year
                                    </option>
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
                                    <option value="Individual">
                                        Individual
                                    </option>
                                    <option value="Committee">
                                        Committee
                                    </option>
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
                                            <th>Competitors</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="9">
                                                    No Products Added
                                                </td>
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
                                                        <td>
                                                            <button type="button" className="competitor-btn" onClick={() => openCompetitorModal(p)}>
                                                                Competitors
                                                            </button>
                                                        </td>

                                                        <td className="actions-cell">
                                                            <button
                                                                type="button"
                                                                className="edit-btn"
                                                                onClick={() =>
                                                                    editProduct(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <FaPen />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-row-btn"
                                                                onClick={() =>
                                                                    deleteProduct(
                                                                        index
                                                                    )
                                                                }
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

                            <div className="Won-lost-btn">
                                <button type="button"
                                    className="won-btn"
                                    onClick={confirmMarkWon}
                                >Won</button>

                                <button type="button" className="lost-btn" onClick={openLostModal}>Lost</button>
                            </div>

                            <div className="final-btn">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        navigate("/opportunities")
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-opp-btn"
                                >
                                    Update Opportunity
                                </button>
                            </div>
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
                                {editingIndex !== null
                                    ? "Edit Product"
                                    : "Add Product"}
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
                                <label>Select Product <span className="imp">*</span></label>
                                <select
                                    value={productForm.product_id}
                                    onChange={(e) => {
                                        const selected = allProducts.find(
                                            (p) => p.product_id === Number(e.target.value)
                                        );

                                        setProductForm({
                                            ...productForm,
                                            product_id: e.target.value,
                                            product_name: selected?.product_name || "",
                                            unit_of_measure: selected?.unit_of_measure || "PCS",
                                            price_per_unit: selected?.list_price || 0
                                        });
                                    }}
                                >
                                    <option value="">
                                        Select Product
                                    </option>

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

                            <div className="form-row">
                                <label>Unit of Measure</label>
                                <select
                                    value={productForm.unit_of_measure}
                                    onChange={(e) =>
                                        setProductForm({
                                            ...productForm,
                                            unit_of_measure:
                                                e.target.value
                                        })
                                    }
                                >
                                    <option>PCS</option>
                                    <option>BOX</option>
                                    <option>KG</option>
                                    <option>LIT</option>
                                    <option>PKT</option>
                                    <option>BAG</option>
                                </select>
                            </div>

                            <div className="form-row-double">
                                <div className="form-row">
                                    <label>Price Per Unit <span className="imp">*</span></label>

                                    <input
                                        type="number"
                                        value={productForm.price_per_unit}
                                        readOnly
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
                                                quantity:
                                                    e.target.value
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
                                                manual_discount:
                                                    e.target.value
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
                                                tax_amount:
                                                    e.target.value
                                            })
                                        }
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="competitor-modal-buttons">

                            <button
                                type="button"
                                className="competitor-modal-cancel-btn"
                                onClick={() =>
                                    setShowProductModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="competitor-modal-save-btn"
                                onClick={saveProduct}
                            >
                                {editingIndex !== null ? "Update Product" : "Add Product"}
                            </button>

                        </div>

                    </div>
                </div>
            )}
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
            {showLostModal && (

                <div
                    className="modal-overlay"
                    onClick={() => setShowLostModal(false)}
                >

                    <div
                        className="product-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">

                            <h3>
                                Select Competitor
                            </h3>

                        </div>

                        <div className="modal-body">

                            <div className="form-row">

                                <label>
                                    Lost To Competitor
                                </label>

                                <select
                                    value={lostCompetitorId}
                                    onChange={(e) =>
                                        setLostCompetitorId(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        Select Competitor
                                    </option>

                                    {availableCompetitors.map((comp) => (

                                        <option
                                            key={
                                                comp.competitor_product_id
                                            }
                                            value={
                                                comp.competitor_product_id
                                            }
                                        >

                                            {comp.competitor_name}
                                            {" - "}
                                            {comp.competitor_product_name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="modal-buttons">

                            <button
                                className="modal-cancel-btn"
                                onClick={() =>
                                    setShowLostModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="lost-btn"
                                onClick={markLost}
                            >
                                Confirm Lost
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {showCompetitorModal && (

                <div
                    className="modal-overlay"
                    onClick={() =>
                        setShowCompetitorModal(false)
                    }
                >

                    <div
                        className="competitor-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <h3>
                                Competitors for{" "}
                                {
                                    selectedOpportunityProduct
                                        ?.product_name
                                }
                            </h3>

                        </div>

                        <div className="modal-body">

                            {availableCompetitors.length === 0 ? (

                                <p>
                                    No competitors available.
                                </p>

                            ) : (

                                availableCompetitors.map(
                                    (competitor) => (

                                        <label
                                            key={competitor.competitor_product_id}
                                            className="competitor-item"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={selectedCompetitors.includes(
                                                    competitor.competitor_product_id
                                                )}
                                                onChange={() =>
                                                    toggleCompetitor(
                                                        competitor.competitor_product_id
                                                    )
                                                }
                                            />

                                            <div className="competitor-info">

                                                <span className="competitor-name">
                                                    {competitor.competitor_name}
                                                </span>

                                                <span className="competitor-product">
                                                    {competitor.competitor_product_name}
                                                </span>

                                            </div>

                                        </label>
                                    )
                                )
                            )}

                        </div>

                        <div className="modal-buttons">

                            <button
                                type="button"
                                className="modal-cancel-btn"
                                onClick={() =>
                                    setShowCompetitorModal(false)
                                }
                            >
                                Cancel
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

export default EditOpportunity;