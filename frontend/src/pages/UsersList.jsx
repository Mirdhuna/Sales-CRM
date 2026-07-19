import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaPen, FaSyncAlt, FaSearch } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
    getUsers,
    deleteUser
} from "../services/userService";

import {
    FaUserPlus,
    FaUserCheck,
    FaUserTimes,
    FaFileExcel
} from "react-icons/fa";

import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { exportToExcel } from "../components/exportToExcel";

import "../css/userList.css";

function UserList() {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const showAlert = (
        type,
        title,
        message,
        onClose
    ) => {

        setAlertModal({
            type,
            title,
            message,
            onClose:
                onClose ||
                (() => setAlertModal(null))
        });

    };

    // ================= FETCH USERS =================

    const fetchUsers = async () => {

        try {

            setLoading(true);

            const data = await getUsers();

            setUsers(data);

        } catch (error) {

            console.error(error);

            showAlert(
                "error",
                "Failed",
                "Unable to load users."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchUsers();

    }, []);

    useEffect(() => {

        setCurrentPage(1);

    }, [searchTerm]);

    // ================= STATUS =================

    const handleDelete = (id) => {

        const currentUser = JSON.parse(localStorage.getItem("user"));

        if (currentUser.userId === id) {
            showAlert(
                "warning",
                "Action Not Allowed",
                "You cannot delete your own account."
            );

            return;

        }

        setConfirmModal({

            title: "Delete User",

            message:
                "Are you sure you want to delete this user?",

            confirmText: "Delete",

            confirmClass:
                "confirm-modal-delete-btn",

            icon: "delete",

            onConfirm: async () => {

                setConfirmModal(null);

                try {

                    await deleteUser(id);

                    showAlert(
                        "success",
                        "Deleted",
                        "User deleted successfully."
                    );

                    fetchUsers();

                } catch (error) {

                    console.error(error);

                    showAlert(
                        "error",
                        "Failed",
                        "Unable to delete user."
                    );

                }

            }

        });

    };


    // ================= EXPORT =================

    const handleExport = () => {

        const exportData =
            filteredUsers.map((user) => ({

                ID: user.user_id,

                Name: user.name,

                Email: user.email,

                Role: user.role,

                Status: user.is_active
                    ? "Active"
                    : "Inactive",

                "Last Login":
                    user.last_login || "-"

            }));

        exportToExcel(
            exportData,
            "Users"
        );

    };

    // ================= FILTER =================

    const filteredUsers = users.filter(
        (user) =>
            user.name
                ?.toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                ) ||

            user.email
                ?.toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                ) ||

            user.role
                ?.toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )
    );

    // ================= PAGINATION =================

    const totalPages = Math.ceil(
        filteredUsers.length / pageSize
    );

    const paginatedUsers =
        filteredUsers.slice(

            (currentPage - 1) * pageSize,

            currentPage * pageSize
        );

    // ================= UI =================

    return (

        <div className="users-layout">

            <Sidebar />

            <div className="users-container">

                <Topbar title="Users" />

                <div className="users-header">
                    <div className="user-right-action">
                    <div className="user-search-box">
                        <FaSearch className="user-search-icon"/>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                        className="search-input"
                    />
                    </div>
                    <button className="users-clear-btn" onClick={()=>{setSearchTerm(""); setCurrentPage(1);}}><FaSyncAlt/> Clear</button>
                    </div>
                    <div className="user-left-action">
                    {JSON.parse(localStorage.getItem("user"))?.role === "Admin" && (
                        <button
                            className="add-btn"
                            onClick={() =>
                                navigate("/users/add")
                            }
                        >
                            <FaUserPlus />
                            Add User
                        </button>
                    )}

                    <button
                        className="export-btn"
                        onClick={handleExport}
                    >
                        <FaFileExcel />
                        Export To Excel
                    </button>
                    </div>
                </div>

                <div className="table-wrapper">

                    {loading ? (

                        <p className="loading">
                            Loading users...
                        </p>

                    ) : (

                        <>
                            <table className="users-table">

                                <thead>

                                    <tr>

                                        <th>ID</th>

                                        <th>Name</th>

                                        <th>Email</th>

                                        <th>Role</th>

                                        <th>Status</th>

                                        <th>Last Login</th>

                                        <th>Actions</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {paginatedUsers.length >
                                        0 ? (

                                        paginatedUsers.map(
                                            (user) => (

                                                <tr
                                                    key={
                                                        user.user_id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            user.user_id
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            user.name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            user.email
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            user.role
                                                        }
                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status-badge ${user.is_active
                                                                ? "active"
                                                                : "inactive"
                                                                }`}
                                                        >

                                                            {user.is_active
                                                                ? "Active"
                                                                : "Inactive"}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        {user.last_login
                                                            ? new Date(
                                                                user.last_login
                                                            ).toLocaleString()
                                                            : "-"}

                                                    </td>

                                                    <td
                                                        className="actions"
                                                    >

                                                        <button
                                                            title="Edit"
                                                            className="edit-btn"
                                                            onClick={() =>
                                                                navigate(`/users/edit/${user.user_id}`)
                                                            }
                                                        >
                                                            <FaPen />
                                                        </button>

                                                        <button
                                                            title="Delete"
                                                            className="delete-btn"
                                                            onClick={() =>
                                                                handleDelete(user.user_id)
                                                            }
                                                        >
                                                            <FaTrash />
                                                        </button>


                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="7"
                                                style={{
                                                    textAlign:
                                                        "center"
                                                }}
                                            >

                                                No users found

                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                            <div className="pagination-wrapper">

                                <Pagination
                                    currentPage={
                                        currentPage
                                    }
                                    totalPages={
                                        totalPages
                                    }
                                    onPageChange={
                                        setCurrentPage
                                    }
                                    pageSize={
                                        pageSize
                                    }
                                    onPageSizeChange={(
                                        size
                                    ) => {

                                        setPageSize(
                                            size
                                        );

                                        setCurrentPage(
                                            1
                                        );

                                    }}
                                />

                            </div>
                        </>
                    )}
                </div>
            </div>

            {confirmModal && (

                <ConfirmModal
                    title={
                        confirmModal.title
                    }
                    message={
                        confirmModal.message
                    }
                    confirmText={
                        confirmModal.confirmText
                    }
                    confirmClass={
                        confirmModal.confirmClass
                    }
                    icon={confirmModal.icon}
                    onConfirm={
                        confirmModal.onConfirm
                    }
                    onCancel={() =>
                        setConfirmModal(
                            null
                        )
                    }
                />

            )}

            {alertModal && (

                <AlertModal
                    type={alertModal.type}
                    title={alertModal.title}
                    message={
                        alertModal.message
                    }
                    onClose={
                        alertModal.onClose
                    }
                />

            )}

        </div>
    );
}

export default UserList;