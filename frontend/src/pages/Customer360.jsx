import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Customer360.css";

function ViewAccount() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [customerData, setCustomerData] = useState(null);

    useEffect(() => {
        fetchCustomer360();
    }, []);

    const fetchCustomer360 = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/accounts/${id}/customer360`);
            setCustomerData(res.data);
        }
        catch (err) {
            console.error(err);
        }
    };

    if (!customerData) {
        return <div>Loading...</div>;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="dashboard-container-c">
            <Sidebar />

            <div className="main-content-cust">
                <Topbar title="Customer 360 View" />
                <div className="page-content">

                    <div className="account-header-card">

                        {/* Top Row: Name + Status */}
                        <div className="account-top-row">
                            <div>
                                <h2 className="account-name">
                                    {customerData.account.account_name}
                                </h2>

                                <div className="account-badges">
                                    <span className="badge industry">
                                        {customerData.account.industry}
                                    </span>

                                    <span className={`badge status ${customerData.account.status ? "active" : "inactive"}`}>
                                        {customerData.account.status ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info Row */}
                        <div className="account-info-row">

                            <div className="info-item">
                                📞 {customerData.account.phone}
                            </div>

                            <div className="info-item">
                                🌐 {customerData.account.website}
                            </div>

                            <div className="info-item">
                                👤 Primary Contact:{" "}
                                {customerData.primary_contact
                                    ? `${customerData.primary_contact.first_name} ${customerData.primary_contact.last_name}`
                                    : "N/A"}
                            </div>

                            <div className="info-item">
                                📅 Created: {formatDate(customerData.account.created_at)}
                            </div>

                            <div className="info-item">
                                🕒 Last Activity: {formatDate(customerData.last_activity)}
                            </div>

                        </div>

                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="summary-cards">

                        <div className="summary-card1 contacts">
                            <h4>Contacts</h4>
                            <p>{customerData.summary.contacts}</p>
                        </div>

                        <div className="summary-card1 opportunities">
                            <h4>Opportunities</h4>
                            <p>{customerData.summary.opportunities}</p>
                        </div>

                        <div className="summary-card1 quotes">
                            <h4>Quotes</h4>
                            <p>{customerData.summary.quotes}</p>
                        </div>

                        <div className="summary-card1 orders">
                            <h4>Orders</h4>
                            <p>{customerData.summary.orders}</p>
                        </div>

                        <div className="summary-card1 invoices">
                            <h4>Invoices</h4>
                            <p>{customerData.summary.invoices}</p>
                        </div>

                        <div className="summary-card1 revenue">
                            <h4>Revenue</h4>
                            <p>₹ {Number(customerData.summary.revenue).toLocaleString()}</p>
                        </div>

                    </div>

                    {/* ───────────────── CONTACTS ───────────────── */}
                    <div className="section">
                        <h3>Contacts</h3>
                        <table className="customer360-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Job Title</th>
                                    <th>Contact Method</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerData.contacts.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: "center", color: "#9ca3af" }}>No contacts found</td></tr>
                                ) : (
                                    customerData.contacts.map((contact) => (
                                        <tr key={contact.contact_id}>
                                            <td className="first-col">
                                                <span
                                                    className="row-link"
                                                    onClick={() => navigate("/contacts")}
                                                >
                                                    {contact.first_name} {contact.last_name}
                                                </span>
                                            </td>
                                            <td>{contact.email || "—"}</td>
                                            <td>{contact.phone || "—"}</td>
                                            <td>{contact.job_title || "—"}</td>
                                            <td>{contact.contact_method || "—"}</td>
                                            <td>{formatDate(contact.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ───────────────── OPPORTUNITIES ───────────────── */}
                    <div className="section">
                        <h3>Opportunities</h3>

                        <table className="customer360-table">
                            <thead>
                                <tr>
                                    <th>Topic</th>
                                    <th>Status</th>
                                    <th>Budget</th>
                                    <th>Primary Contact</th>
                                    <th>Purchase Timeframe</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customerData.opportunities.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: "center", color: "#9ca3af" }}>No opportunities found</td></tr>
                                ) : (
                                    customerData.opportunities.map((op) => (
                                        <tr key={op.opportunity_id}>
                                            <td className="first-col">
                                                <span
                                                    className="row-link"
                                                    onClick={() => navigate("/opportunities")}
                                                >
                                                    {op.topic}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge status ${op.status === "Won" ? "active" : op.status === "Lost" ? "inactive" : "prospect"}`}>
                                                    {op.status}
                                                </span>
                                            </td>
                                            <td>₹ {Number(op.budget_amount || 0).toLocaleString()}</td>
                                            <td>{op.primary_contact_name || "—"}</td>
                                            <td>{op.purchase_timeframe || "—"}</td>
                                            <td>{formatDate(op.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ───────────────── QUOTES ───────────────── */}
                    <div className="section">
                        <h3>Quotes</h3>

                        <table className="customer360-table">
                            <thead>
                                <tr>
                                    <th>Quote Code</th>
                                    <th>Topic</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Discount</th>
                                    <th>Tax</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerData.quotes.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: "center", color: "#9ca3af" }}>No quotes found</td></tr>
                                ) : (
                                    customerData.quotes.map((quote) => (
                                        <tr key={quote.quote_id}>
                                            <td className="first-col">
                                                <span
                                                    className="row-link"
                                                    onClick={() => navigate("/quotes")}
                                                >
                                                    {quote.quote_code}
                                                </span>
                                            </td>
                                            <td>{quote.topic}</td>
                                            <td>
                                                <span className={`badge status ${quote.status === "Won" ? "active" : (quote.status === "Lost" || quote.status === "Canceled") ? "inactive" : "prospect"}`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                            <td>₹ {Number(quote.total_amount || 0).toLocaleString()}</td>
                                            <td>₹ {Number(quote.total_discount || 0).toLocaleString()}</td>
                                            <td>₹ {Number(quote.total_tax || 0).toLocaleString()}</td>
                                            <td>{formatDate(quote.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ───────────────── ORDERS ───────────────── */}
                    <div className="section">
                        <h3>Orders</h3>

                        <table className="customer360-table">
                            <thead>
                                <tr>
                                    <th>Order Code</th>
                                    <th>Status</th>
                                    <th>Total Amount</th>
                                    <th>Linked Quote</th>
                                    <th>Requested Delivery</th>
                                    <th>Shipping Method</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customerData.orders.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: "center", color: "#9ca3af" }}>No orders found</td></tr>
                                ) : (
                                    customerData.orders.map((order) => (
                                        <tr key={order.order_id}>
                                            <td className="first-col">
                                                <span
                                                    className="row-link"
                                                    onClick={() => navigate("/orders")}
                                                >
                                                    {order.order_code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge status ${order.status === "Invoiced" ? "active" : order.status === "Canceled" ? "inactive" : "prospect"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>₹ {Number(order.total_amount || 0).toLocaleString()}</td>
                                            <td>{order.linked_quote_code || "—"}</td>
                                            <td>{formatDate(order.requested_delivery)}</td>
                                            <td>{order.shipping_method || "—"}</td>
                                            <td>{formatDate(order.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ───────────────── INVOICES ───────────────── */}
                    <div className="section">
                        <h3>Invoices</h3>

                        <table className="customer360-table">
                            <thead>
                                <tr>
                                    <th>Invoice Code</th>
                                    <th>Status</th>
                                    <th>Total Amount</th>
                                    <th>Linked Order</th>
                                    <th>Due Date</th>
                                    <th>Payment Terms</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customerData.invoices.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: "center", color: "#9ca3af" }}>No invoices found</td></tr>
                                ) : (
                                    customerData.invoices.map((invoice) => (
                                        <tr key={invoice.invoice_id}>
                                            <td className="first-col">
                                                <span
                                                    className="row-link"
                                                    onClick={() => navigate("/invoices")}
                                                >
                                                    {invoice.invoice_code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge status ${invoice.status === "Paid" ? "active" : invoice.status === "Canceled" ? "inactive" : "prospect"}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td>₹ {Number(invoice.total_amount || 0).toLocaleString()}</td>
                                            <td>{invoice.linked_order_code || "—"}</td>
                                            <td>{formatDate(invoice.due_date)}</td>
                                            <td>{invoice.payment_terms || "—"}</td>
                                            <td>{formatDate(invoice.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="section2">
                        <button className="cust-cancel-btn" onClick={() => navigate('/accounts')}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAccount;