import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrash, FaFileExcel, FaSyncAlt, FaSearch } from "react-icons/fa";
import { exportToExcel } from "../components/exportToExcel";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Pagination from "../components/Pagination";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";

import {
    getProducts,
    deleteProduct
} from "../services/productsService";

import "../css/Products.css";

function Products() {

    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [alertModal, setAlertModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data);
    };

    // Add this after the useState declarations
    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    const filteredProducts = products.filter((product) =>
        String(product.product_id).includes(searchTerm) ||
        (product.product_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (product.product_code || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (product.unit_of_measure || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        String(product.list_price || "")
            .includes(searchTerm) ||
        String(product.cost_price || "")
            .includes(searchTerm)
    );

    const handleDelete = async (id) => {
        setConfirmModal({
            title: "Delete Product",
            message: "Are you sure you want to delete this Product.",
            confirmClass: "confirm-modal-delete-btn",
            confirmText: "Delete",
            icon: "delete",
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteProduct(id);
                    setCurrentPage(1);
                    loadProducts();
                    showAlert("success", "Deleted", "Product deleted successfully.")
                } catch (err) {
                    console.error(err);
                    showAlert("error", "Delete Failed", "Something went wrong. Please try again.");
                }
            }
        });
    };

    const handleExportProducts = () => {
        const exportData = products.map(product => ({
            ID: product.product_id,
            ProductName: product.product_name,
            ProductCode: product.product_code,
            Unit: product.unit,
            ListPrice: product.list_price,
            CostPrice: product.cost_price,
            StartDate: product.start_date
                ? new Date(product.start_date).toLocaleDateString()
                : "",
            EndDate: product.end_date
                ? new Date(product.end_date).toLocaleDateString()
                : "",
            Description: product.description
        }));

        exportToExcel(exportData, "Products");
    };
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentProducts = filteredProducts.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const totalPages = Math.ceil(
        filteredProducts.length / itemsPerPage
    );
    return (
        <div className="products-layout">

            <Sidebar />

            <div className="products-content">

                <Topbar title="Products" />

                <div className="products-header">

                    <div className="products-left-actions">
                        <div className="products-search-box">
                        <FaSearch className="products-search-icon"/>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="products-search"
                        />
                        </div>
                        <button className="products-clear-btn" onClick={()=>{
                            setSearchTerm("");
                            setCurrentPage(1);
                        }}> <FaSyncAlt/> Clear</button>
                    </div>
                    <div className="products-right-actions">
                    <button
                        className="add-product-btn"
                        onClick={() => navigate("/products/add")}
                    >
                        Add Product
                    </button>
                    <button
                        className="excel-btn"
                        onClick={handleExportProducts}
                    >
                        <FaFileExcel /> Export as Excel
                    </button>
                    </div>
                </div>

                <div className="products-card">
                    <div className="products-table-wrapper">
                        <table className="products-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>List Price</th>
                                    <th>Cost Price</th>
                                    <th>Unit</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {currentProducts.map(product => (

                                    <tr key={product.product_id}>

                                        <td className="first-col">{product.product_id}</td>
                                        <td>{product.product_name}</td>
                                        <td>{product.product_code}</td>
                                        <td>{product.list_price}</td>
                                        <td>{product.cost_price}</td>
                                        <td>{product.unit_of_measure}</td>

                                        <td>

                                            <button
                                                title="Edit"
                                                onClick={() =>
                                                    navigate(`/products/edit/${product.product_id}`)
                                                }
                                            >
                                                <FaPen />
                                            </button>

                                            <button
                                                title="Delete"
                                                onClick={() =>
                                                    handleDelete(product.product_id)
                                                }
                                            >
                                                <FaTrash />
                                            </button>

                                        </td>

                                    </tr>

                                ))}

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

export default Products;