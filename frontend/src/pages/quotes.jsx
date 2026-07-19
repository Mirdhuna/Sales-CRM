import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrash, FaFileExcel, FaSyncAlt, FaSearch } from "react-icons/fa";
import { exportToExcel } from "../components/exportToExcel";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Pagination from "../components/Pagination";
import API from "../services/api";
import { getQuotes } from "../services/quotesService";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";

import "../css/Quotes.css";

function Quotes() {
    const navigate = useNavigate();

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    const filteredQuotes = quotes.filter((q) =>
        (q.topic || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.account_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.currency || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(q.quote_id).includes(searchTerm)
    );
    //LOAD ALL QUOTES
    const loadQuotes = async () => {
        try {
            setLoading(true);
            const data = await getQuotes();
            console.log("Quotes Data:", data);
            setQuotes(data);
        } catch (err) {
            console.error("Error loading quotes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotes();
    }, []);


    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    // 🗑 DELETE QUOTE
    const deleteQuote = (id) => {
        setConfirmModal({
            title: "Delete Quote?",
            message: "Are you sure you want to delete this Quote?",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await API.delete(`/quotes/${id}`);

                    setQuotes((prev) => {
                        const updated = prev.filter((q) => q.quote_id !== id);

                        const newTotalPages = Math.ceil(updated.length / itemsPerPage);

                        if (currentPage > newTotalPages && currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                        }

                        return updated;
                    });
                    showAlert("success", "Delete", "Quote deleted successfully.");

                } catch (err) {
                    console.error(err);
                    showAlert("error", "Delete Failed", "Something went wrong.Please try again.");
                }
            }
        });
    };

    const handleExportQuotes = () => {
        const exportData = quotes.map(quote => ({
            QuoteID: quote.quote_id,
            QuoteNumber: quote.quote_number,
            Subject: quote.subject,
            Account: quote.account_name,
            Status: quote.status,
            SubTotal: quote.detail_amount,
            Discount: quote.total_discount,
            Tax: quote.total_tax,
            GrandTotal: quote.total_amount,
            ValidUntil: quote.valid_until
                ? new Date(quote.valid_until).toLocaleDateString()
                : "",
            CreatedAt: quote.created_at
                ? new Date(quote.created_at).toLocaleDateString()
                : ""
        }));

        exportToExcel(exportData, "Quotes");
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentQuotes = filteredQuotes.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
    return (
        <div className="quotes-layout" >
            <Sidebar />

            <div className="quotes-container">
                <Topbar title="Quotes" />

                <br></br>
                <div className="quotes-toolbar">
                    <div className="quotes-right-action">
                        <div className="quotes-search-box">
                            <FaSearch className="quotes-search-icon" />
                            <input
                                type="text"
                                placeholder="Search quotes..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="quotes-search"
                            />
                        </div>
                        <button className="quotes-clear-btn" onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                        }}><FaSyncAlt /> Clear</button>
                    </div>
                    <div className="quotes-left-action">
                        <button className="excel-btn" onClick={handleExportQuotes}>
                            <FaFileExcel /> Export to Excel
                        </button>
                    </div>
                </div>
                <br></br>
                <div className="quotes-table-wrapper">
                    <table className="quotes-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Topic</th>
                                <th>Account</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Currency</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7">Loading...</td>
                                </tr>
                            ) : quotes.length === 0 ? (
                                <tr>
                                    <td colSpan="7">No Quotes Found</td>
                                </tr>
                            ) : (
                                currentQuotes.map((q) => (
                                    <tr key={q.quote_id}>
                                        <td className="first-col">{q.quote_id}</td>

                                        <td>{q.topic}</td>

                                        <td>{q.account_name || "—"}</td>

                                        <td>
                                            {q.first_name
                                                ? `${q.first_name} ${q.last_name}`
                                                : "—"}
                                        </td>

                                        <td>
                                            <span className={`status ${q.status}`}>
                                                {q.status}
                                            </span>
                                        </td>

                                        <td>{q.currency}</td>

                                        <td className="actions-cell">

                                            <button
                                                title="Edit"
                                                className="edit-btn"
                                                onClick={() => {
                                                    console.log("Clicked Quote ID:", q.quote_id);
                                                    navigate(`/quotes/edit/${q.quote_id}`);
                                                }}
                                            >
                                                <FaPen />
                                            </button>

                                            <button
                                                title="Delete"
                                                className="delete-btn"
                                                onClick={() => deleteQuote(q.quote_id)}
                                            >
                                                <FaTrash />
                                            </button>
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

            {
                alertModal && (
                    <AlertModal
                        type={alertModal.type}
                        title={alertModal.title}
                        message={alertModal.message}
                        onClose={alertModal.onClose}
                    />
                )
            }
        </div >
    );
}

export default Quotes;