import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAccountById, updateAccount } from "../services/accountsService";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AccountsForm from "../components/AccountsForm";
import AlertModal from "../components/AlertModal";

function EditAccount() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [alertModal, setAlertModal] = useState(null);

    const [formData, setFormData] = useState({
        account_id: "",
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

    // FETCH ACCOUNT
    useEffect(() => {
        fetchAccount();
    }, [id]);

    const fetchAccount = async () => {
        try {
            const data = await getAccountById(id);
            setFormData(data);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch account");
        }
    };

    // HANDLE CHANGE
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const showAlert = (type, title, message, onClose) => {
        setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
    };

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

        const missingFields = requiredFields
            .filter(field =>
                !formData[field.key] ||
                String(formData[field.key]).trim() === ""
            )
            .map(field => field.label);

        if (missingFields.length > 0) {
            showAlert("warning", "Missing Fields", missingFields.join('\n'));
            return false;
        }

        return true;
    };

    // UPDATE ACCOUNT
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await updateAccount(id, {
                ...formData,
                primary_contact_id: formData.primary_contact_id
                    ? parseInt(formData.primary_contact_id)
                    : null
            });

            showAlert("success", "Account Updated", "Account Updated Successfully.", () => {
                setAlertModal(null);
                navigate("/accounts");
            });

        } catch (err) {
            console.error(err);
            showAlert("error", "Failed", "Failed to update the Account");
        }
    };

    return (
        <div className="account-layout">
            <Sidebar />

            <div className="account-content">
                <Topbar title="Accounts" />
                <div className="account-form-container">
                    <AccountsForm
                        formData={formData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        buttonText="Update Account"
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

export default EditAccount;