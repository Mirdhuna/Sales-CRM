import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { exportToExcel } from "../components/exportToExcel";
import Filters from "../components/Filters";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FaPen, FaTrash } from "react-icons/fa";
import Pagination from "../components/Pagination";
import "../css/Leads.css";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";


import { getLeads, deleteLead } from "../services/leadsService";

function Leads() {
    const navigate = useNavigate();

    const [leads, setLeads] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const handleExportLeads = () => {
        const exportData = leads.map(lead => ({
            ID: lead.lead_id,
            FirstName: lead.first_name,
            LastName: lead.last_name,
            Company: lead.company_name,
            Email: lead.email,
            Phone: lead.phone,
            LeadSource: lead.lead_source,
            Status: lead.status,
            CreatedAt: lead.created_at
                ? new Date(lead.created_at).toLocaleDateString()
                : ""
        }));

        exportToExcel(exportData, "Leads");
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const res = await getLeads();
            setLeads(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    }


    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete Lead",
            message: "Are you sure you want to delete this lead?",
            confirmClass: "confirm-modal-delete-btn",
            confirmText: "Delete",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteLead(id);
                    showAlert("success", "Deleted", "Lead deleted successfully");
                    loadLeads();
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Delete Failed", "SOmething went wrong.Please Try again.");
                }
            }
        });
    };


    const filtered = leads.filter((l) =>
        l.topic?.toLowerCase().includes(search.toLowerCase()) ||
        l.primary_contact?.toLowerCase().includes(search.toLowerCase()) ||
        l.account_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / pageSize);

    const paginatedLeads = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="leads-layout">
            <Sidebar />

            <div className="leads-container">
                <Topbar title="Leads" />

                <Filters
                    searchPlaceholder="Search leads..."
                    addLabel="Add Lead"
                    onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
                    onClear={() => { setSearch(""); setCurrentPage(1) }}
                    onAdd={() => navigate("/add-lead")}
                    onExport={handleExportLeads}
                />
                <div className="leads-table-wrapper">
                    <table className="leads-table">
                        <thead>
                            <tr>
                                <th>Topic</th>
                                <th>Account</th>
                                <th>Primary Contact</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Budget</th>
                                <th>Timeframe</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedLeads.map((l) => (
                                <tr key={l.lead_id}>
                                    <td className="first-col">{l.topic}</td>
                                    <td>{l.account_name}</td>
                                    <td>{l.primary_contact}</td>
                                    <td>
                                        {l.rating && (
                                            <span className={`rating-badge rating-${l.rating.toLowerCase()}`}>
                                                {l.rating}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {l.status && (
                                            <span className={`status-badge status-${l.status.toLowerCase()}`}>
                                                {l.status}
                                            </span>
                                        )}
                                    </td>
                                    <td>{l.estimated_budget}</td>
                                    <td>{l.purchase_timeframe}</td>
                                    <td>{l.created_at}</td>

                                    <td>
                                        <div className="action-buttons">

                                            <button
                                                className="icon-btn edit"
                                                onClick={() => navigate(`/edit-lead/${l.lead_id}`)}
                                            >
                                                <FaPen />
                                            </button>

                                            <button
                                                className="icon-btn delete"
                                                onClick={() => handleDelete(l.lead_id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default Leads;