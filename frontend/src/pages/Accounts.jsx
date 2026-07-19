import React, { useEffect, useState } from "react";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAccounts, deleteAccount } from "../services/accountsService";
import { exportToExcel } from "../components/exportToExcel";

import "../css/Accounts.css";

// ================= FILTER CONFIG =================
const ACCOUNT_FILTERS = [
    {
        name: "industry",
        placeholder: "Search by industry",
        options: [
            "Technology", "Finance", "Healthcare", "E-Commerce", "Software",
            "Manufacturing", "Education", "Retail", "Engineering",
            "Conglomerate", "Food & Beverage", "Pharmaceuticals", "Research"
        ],
    },
    {
        name: "contacts",
        placeholder: "All Contacts",
        options: ["Has Contacts", "No Contacts"],
    },
    {
        name: "status",
        placeholder: "All Status",
        options: ["Active", "Inactive"],
    },
];

function Accounts() {
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState({});

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null)


    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };
    //exporting excel file
    const handleExportAccounts = () => {
        const exportData = accounts.map(account => ({
            ID: account.account_id,
            Name: account.account_name,
            Industry: account.industry,
            Website: account.website,
            Phone: account.phone
        }));

        exportToExcel(exportData, "Accounts");
    };
    // ================= FETCH =================
    const fetchAccounts = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            console.error("Error fetching accounts:", err);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeFilters]);

    // ================= DELETE =================
    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete Account",
            message: "Are you sure you want to delete this Account?",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);


                try {
                    await deleteAccount(id);
                    showAlert("success", "Deleted", "Account deleted successfully");
                    fetchAccounts();
                } catch (err) {
                    console.error("Delete failed:", err);
                    showAlert("error", "Delete failed", "SOmething went wrong. Please try again.");
                }
            }
        });
    };

    // ================= FILTER HANDLERS =================
    const handleSearch = (val) => setSearch(val);
    const handleFilterChange = (name, value) =>
        setActiveFilters((prev) => ({ ...prev, [name]: value }));

    const handleClear = () => {
        setSearch("");
        setActiveFilters({});
    };

    // ================= STATUS LABEL =================
    const getStatusLabel = (status) => {
        if (status === true || status === 1 || status === "Active") return "Active";
        if (status === false || status === 0 || status === "Inactive") return "Inactive";
        return "Unknown";
    };

    // ================= DERIVED DATA =================
    const filteredAccounts = accounts.filter((acc) => {
        const statusLabel = getStatusLabel(acc.status);

        const matchesSearch =
            !search ||
            acc.account_name?.toLowerCase().includes(search.toLowerCase()) ||
            acc.phone?.includes(search) ||
            String(acc.primary_contact_name || "")
                .toLowerCase()
                .includes(search.toLowerCase())

        const matchesIndustry =
            !activeFilters.industry ||
            acc.industry === activeFilters.industry;

        const matchesStatus =
            !activeFilters.status ||
            statusLabel === activeFilters.status;

        const matchesContacts =
            !activeFilters.contacts ||
            (activeFilters.contacts === "Has Contacts" && acc.primary_contact_name) ||
            (activeFilters.contacts === "No Contacts" && !acc.primary_contact_name);

        return (
            matchesSearch &&
            matchesIndustry &&
            matchesStatus &&
            matchesContacts
        );
    });

    // ================= PAGINATION =================
    const totalPages = Math.ceil(
        filteredAccounts.length / pageSize
    );

    const paginatedAccounts = filteredAccounts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // ================= UI =================
    return (
        <div className="account-layout">
            <Sidebar />

            <div className="account-content">
                <Topbar title="Accounts" />

                <Filters
                    searchPlaceholder="Search by account name"
                    filters={ACCOUNT_FILTERS}
                    addLabel="Add Account"
                    showExport={true}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onClear={handleClear}
                    onAdd={() => navigate("/add-account")}
                    onExport={handleExportAccounts}
                />

                {/* TABLE */}
                <div className="account-table-wrapper">
                    <div className="account-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Account Name</th>
                                    <th>Industry</th>
                                    <th>Phone</th>
                                    <th>Primary Contact</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedAccounts.length > 0 ? (
                                    paginatedAccounts.map((acc) => {
                                        const statusLabel = getStatusLabel(acc.status);

                                        return (
                                            <tr key={acc.account_id}>
                                                <td className="acc-name">{acc.account_name}</td>
                                                <td>{acc.industry}</td>
                                                <td>{acc.phone}</td>
                                                <td>{acc.primary_contact_name}</td>

                                                <td>
                                                    <span className={`account-status ${statusLabel.toLowerCase()}`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>

                                                <td>
                                                    {acc.created_at
                                                        ? new Date(acc.created_at).toLocaleDateString()
                                                        : "—"}
                                                </td>

                                                <td className="account-action-buttons">

                                                    <button className="account-icon-btn account-view-btn"
                                                        title="360 View"
                                                        onClick={() => navigate(`/view-account/${acc.account_id}`)}
                                                    ><FaEye /></button>
                                                    <button
                                                        className="account-icon-btn account-edit-btn"
                                                        title="Edit"
                                                        onClick={() =>
                                                            navigate(`/edit-account/${acc.account_id}`)
                                                        }
                                                    >
                                                        <FaPen />
                                                    </button>

                                                    <button
                                                        className="account-icon-btn account-delete-btn"
                                                        title="Delete"
                                                        onClick={() => handleDelete(acc.account_id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7">No Accounts Found</td>
                                    </tr>
                                )}
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

export default Accounts;