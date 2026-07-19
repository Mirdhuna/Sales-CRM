import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../services/orderService";
import "../css/Orders.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FaPen, FaSearch, FaSyncAlt, FaTrash } from "react-icons/fa"
import { deleteOrder } from "../services/orderService";
import { exportToExcel } from "../components/exportToExcel";
import Pagination from "../components/Pagination";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data);
            console.log(orders);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "status active";
            case "won":
                return "status won";
            case "lost":
                return "status lost";
            case "canceled":
                return "status canceled";
            default:
                return "status";
        }
    };

    const filteredOrders = orders.filter((order) =>
        String(order.order_id).includes(searchTerm) ||
        (order.order_code || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (order.account_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (order.topic || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (order.status || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        String(order.quote_id || "")
            .includes(searchTerm)
    );

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const handleDelete = async (orderId) => {
        setConfirmModal({
            title: "Delete Order?",
            message: "Are you sure you want to delete this Order?",
            confirmText: "Delete",
            confirmClass: "confirm-modal-delete-btn",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteOrder(orderId);

                    const updatedOrders = orders.filter(
                        (order) => order.order_id !== orderId
                    );

                    setOrders(updatedOrders);

                    const newTotalPages = Math.ceil(
                        updatedOrders.length / itemsPerPage
                    );

                    if (currentPage > newTotalPages && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }

                    showAlert("success", "Delete", "Order deleted successfully");
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Delete Failed", "Something went wrong. Please try again.");
                }
            }
        });
    };

    const handleExportOrders = () => {
        const exportData = orders.map(order => ({
            OrderID: order.order_id,
            OrderNumber: order.order_number,
            Subject: order.subject,
            Account: order.account_name,
            Status: order.status,
            SubTotal: order.detail_amount,
            Discount: order.total_discount,
            Tax: order.total_tax,
            GrandTotal: order.total_amount,
            DueDate: order.due_date
                ? new Date(order.due_date).toLocaleDateString()
                : "",
            CreatedAt: order.created_at
                ? new Date(order.created_at).toLocaleDateString()
                : ""
        }));

        exportToExcel(exportData, "Orders");
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentOrders = filteredOrders.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    if (loading) {
        return (
            <div className="orders-container">
                <Sidebar />
                <div className="orders-top">
                    <Topbar title="Orders" />
                    <p style={{ padding: "20px" }}>Loading orders...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="orders-container" >
            <Sidebar />

            <div className="orders-top">
                <Topbar title="Orders" />
                <br></br>
                <div className="orders-toolbar">
                    <div className="orders-right-action">
                        <div className="orders-search-box">
                            <FaSearch className="orders-search-icon"/>
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="orders-search"
                            />
                        </div>
                        <button className="orders-clear-btn" onClick={() => { setSearchTerm(""); setCurrentPage(1) }}><FaSyncAlt />Clear</button>
                    </div>

                    <div className="orders-left-action">

                        <button
                            className="excel-btn"
                            onClick={handleExportOrders}
                        >
                            Export To Excel
                        </button>
                    </div>
                </div>
                <div className="orders-table-wrapper">
                    <br></br>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Order Code</th>
                                <th>Account</th>
                                <th>Quote Id</th>
                                <th>Topic</th>
                                <th>Status</th>
                                <th>Total Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <tr key={order.order_id}>
                                        <td className="first-col">{order.order_id}</td>
                                        <td>{order.order_code}</td>
                                        <td>{order.account_name || "-"}</td>
                                        <td>{order.quote_id}</td>
                                        <td>{order.topic}</td>

                                        <td>
                                            <span className={getStatusClass(order.status)}>
                                                {order.status}
                                            </span>
                                        </td>

                                        <td>
                                            {order.total_amount
                                                ? Number(order.total_amount).toLocaleString()
                                                : "-"}
                                        </td>

                                        <td>
                                            <div className="action-buttons">
                                                <button className="icon-btn edit" title="Edit" onClick={() => navigate(`/orders/edit/${order.order_id}`)}>
                                                    <FaPen />
                                                </button>
                                                <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(order.order_id)}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="no-data">
                                        No orders found
                                    </td>
                                </tr>
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

export default Orders;