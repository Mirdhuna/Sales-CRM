import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaSearch, FaSyncAlt, FaTrash } from "react-icons/fa";
import { exportToExcel } from "../components/exportToExcel";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";
import { deleteInvoice, getInvoices } from "../services/invoiceService";
import "../css/InvoiceList.css";

function InvoiceList() {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ── Modal states ──
    const [confirmModal, setConfirmModal] = useState(null);
    const [alertModal, setAlertModal] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const filteredInvoices = invoices.filter((inv) =>
        String(inv.invoice_id).includes(searchTerm) ||
        String(inv.order_id || "").includes(searchTerm) ||
        (inv.account_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (inv.topic || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (inv.status || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const loadInvoices = async () => {
        try {
            const data = await getInvoices();
            setInvoices(data);
        } catch (err) {
            console.error("Failed to load invoices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        navigate(`/invoices/edit/${id}`);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete Invoice?",
            message: "Are you sure you want to delete this invoice? This action cannot be undone.",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteInvoice(id);

                    const updatedInvoices = invoices.filter(inv => inv.invoice_id !== id);
                    setInvoices(updatedInvoices);

                    const newTotalPages = Math.ceil(updatedInvoices.length / itemsPerPage);
                    if (currentPage > newTotalPages && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }

                    showAlert("success", "Invoice Deleted", "The invoice has been deleted successfully.");
                } catch (err) {
                    console.error("Failed to delete Invoice", err);
                    showAlert("error", "Delete Failed", "Something went wrong while deleting the invoice. Please try again.");
                }
            }
        });
    };

    const handleExportInvoices = () => {
        const exportData = invoices.map(invoice => ({
            InvoiceID: invoice.invoice_id,
            InvoiceNumber: invoice.invoice_code,
            Account: invoice.account_name,
            Status: invoice.status,
            SubTotal: invoice.detail_amount,
            Discount: invoice.total_discount,
            Tax: invoice.total_tax,
            GrandTotal: invoice.total_amount,
            DueDate: invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString()
                : "",
            DeliveredDate: invoice.date_delivered
                ? new Date(invoice.date_delivered).toLocaleDateString()
                : "",
            CreatedAt: invoice.created_at
                ? new Date(invoice.created_at).toLocaleDateString()
                : ""
        }));

        exportToExcel(exportData, "Invoices");
    };

    if (loading) {
        return (
            <div className="invoice-layout">
                <Sidebar />
                <div className="invoice-content">
                    <Topbar title="Invoices" />
                    <p style={{ padding: "20px" }}>Loading invoices...</p>
                </div>
            </div>
        );
    }

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentInvoices = filteredInvoices.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const totalPages = Math.ceil(
        filteredInvoices.length / itemsPerPage
    );
    return (
        <div className="invoice-layout">
            <Sidebar />

            <div className="invoice-content">
                <Topbar title="Invoices" />
                <br />
                <div className="invoice-toolbar">
                    <div className="invoices-right-action">
                        <div className="invoices-search-box">
                            <FaSearch className="invoices-search-icon" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="invoice-search"
                            />
                        </div>
                        <button className="invoices-clear-btn" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}><FaSyncAlt /> Clear</button>
                    </div>
                    <div className="invoices-left-action">

                        <button
                            className="excel-btn"
                            onClick={handleExportInvoices}
                        >
                            Export To Excel
                        </button>
                    </div>
                </div>
                <br />

                <div className="invoice-card">
                    <div className="invoice-table-wrapper">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Invoice Id</th>
                                    <th>Account</th>
                                    <th>Order Id</th>
                                    <th>Topic</th>
                                    <th>Date Delivered</th>
                                    <th>Due Date</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: "center" }}>
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : (
                                    currentInvoices.map((inv) => (
                                        <tr key={inv.invoice_id}>
                                            <td className="first-col">{inv.invoice_id}</td>
                                            <td>{inv.account_name}</td>
                                            <td>{inv.order_id}</td>
                                            <td>{inv.topic}</td>
                                            <td>
                                                {inv.date_delivered
                                                    ? inv.date_delivered.split("T")[0]
                                                    : "-"}
                                            </td>
                                            <td>
                                                {inv.due_date
                                                    ? inv.due_date.split("T")[0]
                                                    : "-"}
                                            </td>
                                            <td>
                                                {Number(inv.total_amount || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <span className={`status ${inv.status?.toLowerCase()}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        title="Edit"
                                                        className="edit-btn"
                                                        onClick={() => handleEdit(inv.invoice_id)}
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button
                                                        title="Delete"
                                                        className="del-btn"
                                                        onClick={() => handleDelete(inv.invoice_id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>

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

export default InvoiceList;