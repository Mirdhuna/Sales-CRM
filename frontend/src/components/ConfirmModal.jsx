// src/components/ConfirmModal.jsx
import React from "react";
import { FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../css/ConfirmModal.css";

function ConfirmModal({ title, message, confirmText = "Confirm", confirmClass = "confirm-modal-delete-btn", icon = "delete", onConfirm, onCancel }) {

    const iconMap = {
        delete: { component: <FaTrash />,       bgClass: "confirm-icon-red" },
        paid:   { component: <FaCheckCircle />, bgClass: "confirm-icon-purple" },
        close:  { component: <FaTimesCircle />, bgClass: "confirm-icon-red" },
    };

    const { component, bgClass } = iconMap[icon] || iconMap.delete;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal">

                <div className={`confirm-modal-icon ${bgClass}`}>
                    {component}
                </div>

                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>

                <div className="confirm-modal-actions">
                    <button className="confirm-modal-cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={confirmClass} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ConfirmModal;