import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { exportToExcel } from "../components/exportToExcel";
import Filters from "../components/Filters";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Pagination from "../components/Pagination";
import { FaPen, FaTrash } from "react-icons/fa";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import "../css/Opportunity.css"; // reuse same styling for now

import {
    getOpportunities,
    deleteOpportunity
} from "../services/opportunitiesService";

function Opportunities() {

    const navigate = useNavigate();

    const [opportunities, setOpportunities] = useState([]);
    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    useEffect(() => {
        loadOpportunities();
    }, []);

    const loadOpportunities = async () => {
        try {
            const data = await getOpportunities();

            console.log("API Response:", data);

            setOpportunities(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Add this after the useState declarations
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete Opportunity",
            message: "Are you sure you want to delete this Opportunity?",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {

                    await deleteOpportunity(id);
                    showAlert("success", "Deleted", "Opportunity deleted successfully.");
                    loadOpportunities();

                } catch (err) {
                    console.error(err);
                    showAlert("error", "Delete Failed", "Something went wrong.Please try again.");
                }
            }
        });
    };

    const handleExportOpportunities = () => {
        const exportData = opportunities.map(opportunity => ({
            ID: opportunity.opportunity_id,
            OpportunityName: opportunity.opportunity_name,
            Account: opportunity.account_name,
            Stage: opportunity.stage,
            Probability: opportunity.probability,
            ExpectedRevenue: opportunity.expected_revenue,
            CloseDate: opportunity.close_date,
            Status: opportunity.status,
            CreatedAt: opportunity.created_at
                ? new Date(opportunity.created_at).toLocaleDateString()
                : ""
        }));

        exportToExcel(exportData, "Opportunities");
    };

    //console.log(opportunities);   for debugging
    const filtered = opportunities.filter((o) =>
        o.topic?.toLowerCase().includes(search.toLowerCase()) ||
        o.account_name?.toLowerCase().includes(search.toLowerCase()) ||
        `${o.first_name || ""} ${o.last_name || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );


    const totalPages = Math.ceil(filtered.length / pageSize);

    const paginatedOpportunities = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="leads-layout" >

            <Sidebar />

            <div className="leads-container">

                <Topbar title="Opportunities" />

                <Filters
                    searchPlaceholder="Search opportunities..."
                    addLabel="Add Opportunity"
                    onSearch={(value) => { setSearch(value); setCurrentPage(1) }}
                    onClear={() => { setSearch(""); setCurrentPage(1) }}
                    onAdd={() => navigate("/add-opportunity")}
                    onExport={handleExportOpportunities}
                />
                <div className="opportunity-table-wrapper">
                <table className="opportunity-table">

                    <thead>
                        <tr>
                            <th>Topic</th>
                            <th>Account</th>
                            <th>Primary Contact</th>
                            <th>Budget</th>
                            <th>Currency</th>
                            <th>Timeframe</th>
                            <th>Status</th>
                           {/* <th>Competitor</th>*/}
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {paginatedOpportunities.map((o) => (

                            <tr key={o.opportunity_id}>

                                <td className="first-col">{o.topic}</td>

                                <td>{o.account_name}</td>

                                <td>
                                    {o.first_name} {o.last_name}
                                </td>

                                <td>{o.budget_amount}</td>

                                <td>{o.currency}</td>

                                <td>{o.purchase_timeframe}</td>

                                <td>
                                    {o.status && (
                                        <span
                                            className={`status-badge status-${o.status.toLowerCase()}`}
                                        >
                                            {o.status}
                                        </span>
                                    )}
                                </td>

                                {/* FIX: was `opportunities.status === "Lost" ? opp.competitor_name`
                                    `opportunities` is the full array (no .status), and `opp` is
                                    undefined. Both must be `o` (the current row in the map). 
                                <td>
                                    {o.status === "Lost" ? o.competitor_name || "-" : "-"}
                                </td>/ */}

                                <td>
                                    <div className="action-buttons">

                                        <button
                                            className="icon-btn edit" title="Edit"
                                            onClick={() =>
                                                navigate(
                                                    `/edit-opportunity/${o.opportunity_id}`
                                                )
                                            }
                                        >
                                            <FaPen />
                                        </button>

                                        <button
                                            className="icon-btn delete" title="Delete"
                                            onClick={() =>
                                                handleDelete(o.opportunity_id)
                                            }
                                        >
                                            <FaTrash />
                                        </button>

                                    </div>
                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>
                </div>
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

        </div >
    );
}

export default Opportunities;