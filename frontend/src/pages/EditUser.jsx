import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AlertModal from "../components/AlertModal";
import {
  getUserById,
  updateUser,
} from "../services/userService";

import "../css/editUser.css";

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    employee_code: "",
    phone_number: "",
    department: "",
    designation: "",
    notes: "",
    is_active: true,
    password: ""
  });

  // =========================
  // FETCH USER
  // =========================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id);

        setForm({
          name: res.name || "",
          email: res.email || "",
          role: res.role || "",
          employee_code: res.employee_code || "",
          phone_number: res.phone_number || "",
          department: res.department || "",
          designation: res.designation || "",
          notes: res.notes || "",
          is_active: res.is_active,
          password: ""
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load user");
      }
    };

    fetchUser();
  }, [id]);


  const showAlert = (type, title, message, onClose) => {
    setAlertModal({ type, title, message, onClose: onClose || (() => setAlertModal(null)) });
  };

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!form.name.trim())
      return "Name is required";

    if (!form.email.trim())
      return "Email is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email))
      return "Please enter a valid email address";

    if (!form.role)
      return "Role is required";

    if (
      form.phone_number &&
      !/^\d{10}$/.test(form.phone_number)
    ) {
      return "Phone number must be exactly 10 digits";
    }

    return null;
  };
  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate();

    if (error) {
      showAlert("warning", "Validation Error", error);
      return;
    }

    try {
      await updateUser(id, form);

      showAlert(
        "success",
        "Updated",
        "User updated successfully",
        () => {
          setAlertModal(null);
          navigate("/users");
        }
      );
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        "Update Failed",
        err?.response?.data?.message || "Something went wrong"
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="container">
        <Topbar title="Edit User" />

        <form className="form" onSubmit={handleSubmit}>

          <div className="grid">

            <div>
              <label>Name <span className="imp">*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter Name"
                required
              />
            </div>

            <div>
              <label>Email <span className="imp">*</span></label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>


            <div className="form-group">
              <label>Role <span className="imp">*</span></label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="Admin">Admin</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Sales Representative">Sales Representative</option>
              </select>
            </div>


            <div>
              <label>Employee Code</label>
              <input
                name="employee_code"
                value={form.employee_code}
                onChange={handleChange}
                placeholder="Enter Employee Code"
              />
            </div>

            <div>
              <label>Phone</label>
              <input
                name="phone_number"
                value={form.phone_number}
                placeholder="Enter Phone"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  if (value.length <= 10) {
                    setForm({
                      ...form,
                      phone_number: value
                    });
                  }
                }}
                maxLength={10}
              />
            </div>

            <div>
              <label>Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Enter Department"
              />
            </div>

            <div>
              <label>Designation</label>
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Enter "
              />
            </div>

            {/*<div>
              <label>New Password (optional)</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Leave blank to keep old password"
              />
            </div>*/}

            <div>
              <label>Status</label>

              <select
                name="is_active"
                value={form.is_active ? "Active" : "Inactive"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_active: e.target.value === "Active"
                  })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

          </div>

          <div className="actions">


            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/users")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update User
            </button>
          </div>

        </form>
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

export default EditUser;