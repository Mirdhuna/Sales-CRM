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

import { getSalesLeads, deleteSalesLead } from "../services/SalesLeads";

function SalesLeads() {
    const navigate = useNavigate();

    const [leads, setLeads] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const handleExportLeads = () => {
        const exportData = leads.map(lead => ({
            ID: lead.sales_lead_id,
            Company: lead.company_name,
            FirstName: lead.first_name,
            LastName: lead.last_name,
            Company: lead.company_name,
            Email: lead.email,
            Phone: lead.phone,
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

    const showAlert = (type, title, message) => {
        setAlertModal({
            type,
            title,
            message,
            onClose: () => setAlertModal(null)
        });
    };

    const loadLeads = async () => {
        try {
            const response = await getSalesLeads();
            console.log(response.data);
            setLeads(response.data);
        }
        catch (error) {
            console.error(error);
            showAlert("error", "Error", "Failed to load sales leads.");
        }
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
                    await deleteSalesLead(id);
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
        l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())
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
                    onAdd={() => navigate("/add-sales-lead")}
                    onExport={handleExportLeads}
                />
                <div className="leads-table-wrapper">
                    <table className="leads-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedLeads.map((l) => (
                                <tr key={l.lead_id}>
                                    <td className="first-col">{l.company_name}</td>
                                    <td>{l.first_name}</td>
                                    <td>{l.last_name}</td>
                                    <td>{l.email}</td>
                                    <td>{l.phone}</td>
                                    <td>
                                        {l.status && (
                                            <span className={`status-badge status-${l.status.toLowerCase()}`}>
                                                {l.status}
                                            </span>
                                        )}
                                    </td>
                                    <td>{l.created_at
                                        ? new Date(l.created_at).toLocaleDateString():""
                                        }</td>

                                    <td>
                                        <div className="action-buttons">

                                            <button
                                                className="icon-btn edit"
                                                title="Edit"
                                                onClick={() => navigate(`/edit-sales-lead/${l.lead_id}`)}
                                            >
                                                <FaPen />
                                            </button>

                                            <button
                                                className="icon-btn delete"
                                                title="Delete"
                                                onClick={() => {
                                                    console.log("Deleting:",l);
                                                    handleDelete(l.lead_id);}}
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

export default SalesLeads;