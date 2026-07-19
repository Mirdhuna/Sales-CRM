import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import AccountsForm from "../components/AccountsForm";

import { createAccount } from "../services/accountsService";

import AlertModal from "../components/AlertModal.jsx";

function AddAccount() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        account_name: "",
        industry: "",
        phone: "",
        fax: "",
        website: "",
        currency: "USD",
        annual_revenue: "",
        payment_terms: "",
        shipping_method: "",
        contact_method: "",
        primary_contact_id: "",
        description: "",
        street: "",
        city: "",
        state_province: "",
        zip_postal_code: "",
        country_region: "",
        status: 1
    });

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/contacts");
                const data = await res.json();
                setContacts(data);
            } catch (err) {
                console.error("Failed to fetch contacts", err);
            }
        };
        fetchContacts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

    // Only returns missing field names — no alert() here
    const validateForm = () => {
        const requiredFields = [
            { key: "account_name", label: "Account Name" },
            { key: "industry", label: "Industry" },
            { key: "phone", label: "Phone" },
            { key: "currency", label: "Currency" },
            { key: "payment_terms", label: "Payment Terms" },
            { key: "shipping_method", label: "Shipping Method" },
            { key: "contact_method", label: "Contact Method" }
        ];

        return requiredFields
            .filter(field =>
                !formData[field.key] ||
                String(formData[field.key]).trim() === ""
            )
            .map(field => field.label);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const missingFields = validateForm();

        if (missingFields.length > 0) {
            showAlert(
                "warning",
                "Missing Fields",
                missingFields.join("\n")
            );
            return;
        }

        try {
            await createAccount({
                ...formData,
                primary_contact_id: formData.primary_contact_id
                    ? parseInt(formData.primary_contact_id)
                    : null
            });

            showAlert("success", "Account Added", "Account has been added successfully.", () => {
                setAlertModal(null);
                navigate("/accounts");
            });
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to add account. Please try again.");
        }
    };

    return (
        <div className="account-layout">
            <Sidebar />

            <div className="account-content">
                <Topbar title="Accounts" />

                <div className="account-add-container">
                    <AccountsForm
                        formData={formData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        buttonText="Add Account"
                        contacts={contacts}
                    />
                </div>
            </div>

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

export default AddAccount;