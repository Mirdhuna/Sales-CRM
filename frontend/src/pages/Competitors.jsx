import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getCompetitors, deleteCompetitor } from "../services/competitorsService";
import { FaPen, FaTrash, FaFileExcel, FaSearch, FaSyncAlt } from "react-icons/fa";
import "../css/CompetitorsList.css";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { exportToExcel } from "../components/exportToExcel";

function CompetitorsList() {
    const navigate = useNavigate();

    const [competitors, setCompetitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({
            type,
            title,
            message,
            onClose: onClose || (() => setAlertModal(null))
        });
    };

    // ================= FETCH =================
    const fetchCompetitors = async () => {
        try {
            setLoading(true);
            const data = await getCompetitors();
            setCompetitors(data);
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to load Competitors");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = filteredCompetitors.map((c) => ({
            ID: c.competitor_id,
            Name: c.name,
            Website: c.website,
            City: c.city,
            Country: c.country_region,
            Currency: c.currency,
        }));

        exportToExcel(exportData, "Competitors");
    };

    useEffect(() => {
        fetchCompetitors();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ================= DELETE =================
    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete",
            message: "Are you sure you want to delete this competitor?",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            confirmText: "Delete",

            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteCompetitor(id);
                    showAlert("success", "Deleted", "Competitor deleted successfully.");
                    fetchCompetitors();
                } catch (err) {
                    showAlert("error", "Failed", "Failed to delete the competitor");
                }
            }
        });
    };

    // ================= FILTER =================
    const filteredCompetitors = competitors.filter((c) =>
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.country_region || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ================= PAGINATION =================
    const totalPages = Math.ceil(filteredCompetitors.length / pageSize);

    const paginatedCompetitors = filteredCompetitors.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // ================= UI =================
    return (
        <div className="competitors-layout">
            <Sidebar />

            <div className="competitors-container">
                <Topbar title="Competitors" />

                {/* HEADER */}
                <div className="competitors-header">
                    <div className="comp-right-action">
                        <div className="comp-search-box">
                            <FaSearch className="comp-search-icon" />
                            <input
                                type="text"
                                placeholder="Search competitors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            >
                            </input>
                        </div>
                        <button className="comp-clear-btn" onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                        }}> <FaSyncAlt /> Clear</button>
                    </div>
                    <div className="comp-left-action">
                        <button
                            className="add-btn"
                            onClick={() => navigate("/competitors/add")}
                        >
                            + Add Competitor
                        </button>

                        <button className="export-btn" onClick={handleExport}><FaFileExcel /> Export To Excel</button>
                    </div>
                </div>
                {/* TABLE */}
                <div className="table-wrapper">
                    {loading ? (
                        <p className="loading">Loading competitors...</p>
                    ) : (
                        <>
                            <table className="competitors-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Website</th>
                                        <th>City</th>
                                        <th>Country</th>
                                        <th>Currency</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedCompetitors.length > 0 ? (
                                        paginatedCompetitors.map((c) => (
                                            <tr key={c.competitor_id}>
                                                <td>{c.competitor_id}</td>
                                                <td>{c.name}</td>
                                                <td>{c.website || "-"}</td>
                                                <td>{c.city || "-"}</td>
                                                <td>{c.country_region || "-"}</td>
                                                <td>{c.currency || "-"}</td>

                                                <td className="actions">
                                                    <button
                                                        title="Edit"
                                                        onClick={() =>
                                                            navigate(`/competitors/edit/${c.competitor_id}`)
                                                        }
                                                    >
                                                        <FaPen />
                                                    </button>

                                                    <button
                                                        title="Delete"
                                                        className="delete-btn"
                                                        onClick={() =>
                                                            handleDelete(c.competitor_id)
                                                        }
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center" }}>
                                                No competitors found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* ✅ PAGINATION FIXED (INSIDE TABLE WRAPPER) */}
                            <div className="pagination-wrapper">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    pageSize={pageSize}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODALS */}
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

export default CompetitorsList;