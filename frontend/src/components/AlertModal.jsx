// src/components/AlertModal.jsx
import React from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa";
import "../css/AlertModal.css";

function AlertModal({ type = "success", title, message, onClose }) {
    const config = {
        success: {
            icon: <FaCheckCircle />,
            iconClass: "alert-modal-icon-success",
            btnClass: "alert-modal-btn-success"
        },
        error: {
            icon: <FaTimesCircle />,
            iconClass: "alert-modal-icon-error",
            btnClass: "alert-modal-btn-error"
        },
        warning: {
            icon: <FaExclamationCircle />,
            iconClass: "alert-modal-icon-warning",
            btnClass: "alert-modal-btn-warning"
        }
    };

    const { icon, iconClass, btnClass } = config[type];

    return (
        <div className="alert-modal-overlay">
            <div className="alert-modal">

                <div className={`alert-modal-icon ${iconClass}`}>
                    {icon}
                </div>

                <h3 className="alert-modal-title">{title}</h3>
                <p className="alert-modal-message">{message}</p>

                <button className={`alert-modal-btn ${btnClass}`} onClick={onClose}>
                    OK
                </button>

            </div>
        </div>
    );
}

export default AlertModal;