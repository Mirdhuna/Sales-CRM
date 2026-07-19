import React from "react";
import { FaSearch, FaSyncAlt, FaFileExcel } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../css/Filters.css";
import { useState } from "react";



function Filters({
    searchPlaceholder = "Search...",
    filters = [],
    addLabel = "Add",
    showExport = true,
    onSearch,
    onFilterChange,
    onClear,
    onAdd,
    onExport,
}) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    return (
        <div className="filters-action">

            <div className="filters-right-action">
                {/* SEARCH */}
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>

                {/* DYNAMIC FILTERS */}
                {filters.map((filter) => (
                    <select
                        key={filter.name}
                        onChange={(e) => onFilterChange?.(filter.name, e.target.value)}
                    >
                        <option value="">{filter.placeholder}</option>

                        {filter.options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ))}

                {/* CLEAR */}
                <button className="clear-btn" onClick={onClear}>
                    <FaSyncAlt />
                    Clear
                </button>
            </div>
            <div className="filters-left-action">
                {/* ADD */}
                <button
                    className="add-btn"
                    onClick={onAdd || (() => navigate("/add"))}
                >
                    + {addLabel}
                </button>

                {/* EXPORT */}
                {showExport && (
                    <button className="export-btn" onClick={onExport}>
                        <FaFileExcel />
                        Export to Excel
                    </button>
                )}
            </div>
        </div>
    );
}

export default Filters;