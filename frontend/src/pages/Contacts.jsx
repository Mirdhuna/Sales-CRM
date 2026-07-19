import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Filters from "../components/Filters";
import { exportToExcel } from "../components/exportToExcel";
import { getContacts, deleteContact } from "../services/contactsService";
import { FaPen, FaTrash } from "react-icons/fa";
import "../css/Contact.css";

const CONTACT_FILTERS = [
    {
        name: "contact_method",
        placeholder: "All Methods",
        options: ["Email", "Phone", "SMS", "WhatsApp"],
    },
    {
        name: "job_title",
        placeholder: "All Job Titles",
        options: ["CEO", "CTO", "Manager", "Developer", "Designer"],
    },
];

function Contacts() {
    const navigate = useNavigate();

    const [contacts, setContacts] = useState([]);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({});

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const handleSearch = (val) => setSearch(val);

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setSearch("");
        setFilters({});
    };

    const handleExportContacts = () => {
        const exportData = contacts.map(contact => ({
            ID: contact.contact_id,
            FirstName: contact.first_name,
            LastName: contact.last_name,
            Email: contact.email,
            Phone: contact.phone
        }));

        exportToExcel(exportData, "Contacts");
    };

    // Add this after the useState declarations
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };
    const handleDelete = (id) => {
        setConfirmModal({
            title: "Delete contact?",
            message: "Are you sure you want to delete this conatct?",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteContact(id);
                    setContacts((prev) => prev.filter((c) => c.contact_id !== id));
                    showAlert("success", "Deleted", "Contact deleted successfully.");
                } catch (err) {
                    console.error("Delet failed:",err);
                    showAlert("error", "Delete Failed", "Something went wrong. Please try again.");
                }
            }
        });
    };

    const filteredContacts = contacts.filter((c) => {
        const matchSearch =
            (c.first_name || "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||

            (c.last_name || "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||

            (c.email || "")
                .toLowerCase()
                .includes(search.toLowerCase());
        const matchMethod =
            !filters.contact_method || c.contact_method === filters.contact_method;

        const matchTitle =
            !filters.job_title || c.job_title === filters.job_title;

        return matchSearch && matchMethod && matchTitle;
    });
    // Pagination
    const totalPages = Math.ceil(
        filteredContacts.length / pageSize
    );

    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );


    useEffect(() => {
        loadContacts();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filters]);

    const loadContacts = async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        }
    };
    return (

        <div className="contact-page-layout">
            <Sidebar />

            <div className="contact-page-container">
                <Topbar title="Contacts" />

                <Filters
                    searchPlaceholder="Search contacts..."
                    filters={CONTACT_FILTERS}
                    addLabel="Add Contact"
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onClear={handleClear}
                    onAdd={() => navigate("/add-contact")}
                    onExport={handleExportContacts}

                />

                {/* TABLE */}
                <div className="contact-table-wrapper">
                    <table className="contact-table">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Job Title</th>
                                <th>Method</th>
                                <th>Account</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedContacts.length > 0 ? (
                                paginatedContacts.map((c) => (
                                    <tr key={c.contact_id}>
                                        <td className="first-col">{c.first_name}</td>
                                        <td>{c.last_name}</td>
                                        <td>{c.email}</td>
                                        <td>{c.job_title}</td>
                                        <td>{c.contact_method}</td>
                                        <td>{c.account_name}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString()}</td>

                                        <td>
                                            <div className="contact-action-btn">
                                                <button className="contact-icon-btn edit-btn" title="Edit" onClick={() => navigate(`/edit-contact/${c.contact_id}`)}>
                                                    <FaPen />
                                                </button>

                                                <button className="contact-icon-btn delete-btn" title="Delete" onClick={() => handleDelete(c.contact_id)}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8">No Contacts Found</td>
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

export default Contacts;