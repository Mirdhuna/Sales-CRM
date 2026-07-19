import React from "react";
import "../css/pagination.css";

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    onPageSizeChange
}) {
    return (
        <div className="pagination-container">

            <div className="pagination-buttons">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    ‹
                </button>

                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index + 1}
                        className={
                            currentPage === index + 1
                                ? "active-page"
                                : ""
                        }
                        onClick={() => onPageChange(index + 1)}
                    >
                        {index + 1}
                    </button>
                ))}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    ›
                </button>
            </div>

            <select
                className="Size-btn"
                value={pageSize}
                onChange={(e) =>
                    onPageSizeChange(Number(e.target.value))
                }
            >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
            </select>
        </div>
    );
}

export default Pagination;