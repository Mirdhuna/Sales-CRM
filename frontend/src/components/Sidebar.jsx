import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FaHome,
  FaUserTie,
  FaBuilding,
  FaAddressBook,
  FaChartLine,
  FaUsers,
  FaBox,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaReceipt,
  FaCog,
  FaUserShield
} from "react-icons/fa";

import "../css/Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read the logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = currentUser?.role === "Admin";

  const isActive = (paths) => {
    return paths.some(path =>
      location.pathname.startsWith(path)
    );
  };

  return (
    <div className="sidebar">

      <h2 className="logo">
        <span style={{ color: "blue" }}>Sales</span> CRM
      </h2>

      <ul>

        <li className={location.pathname === "/dashboard" ? "active" : ""}
          onClick={() => navigate("/dashboard")}>
          <FaHome className="icon" />
          Dashboard
        </li>

        <li className={isActive(["/salesLeads", "/add-sales-lead","/edit-sales-lead"]) ? "active" : ""}
          onClick={() => navigate("/salesLeads")}>
          <FaUserTie className="icon" />
          Sales Leads
        </li>

        {/*<li onClick={() => navigate("/leads")}>
          <FaUserTie className="icon" />
          Leads
        </li>*/}

        <li className={ isActive(["/accounts","/add-account","/edit-account","/view-account"]) ? "active" : ""}
          onClick={() => navigate("/accounts")}>
          <FaBuilding className="icon" />
          Accounts
        </li>

        <li className={ isActive(["/contacts","/add-contact","/edit-contact"]) ? "active" : ""}
          onClick={() => navigate("/contacts")}>
          <FaAddressBook className="icon" />
          Contacts
        </li>

        <li className={ isActive(["/opportunities","/add-opportunity","/edit-opportunity"]) ? "active" : ""}
          onClick={() => navigate("/opportunities")}>
          <FaChartLine className="icon" />
          Opportunities
        </li>

        <li className={ isActive(["/competitors"]) ? "active" : ""}
          onClick={() => navigate("/competitors")}>
          <FaUsers className="icon" />
          Competitors
        </li>

        <li className={ isActive(["/products"]) ? "active" : ""}
          onClick={() => navigate("/products")}>
          <FaBox className="icon" />
          Products
        </li>

        <li className={ isActive(["/quotes"]) ? "active" : ""}
          onClick={() => navigate("/quotes")}>
          <FaFileInvoiceDollar className="icon" />
          Quotes
        </li>

        <li className={ isActive(["/orders"]) ? "active" : ""}
          onClick={() => navigate("/orders")}>
          <FaShoppingCart className="icon" />
          Orders
        </li>

        <li className={ isActive(["/invoices"]) ? "active" : ""}
          onClick={() => navigate("/invoices")}>
          <FaReceipt className="icon" />
          Invoices
        </li>

        {/* Only visible to Admins */}
        {isAdmin && (
          <li className={ isActive(["/users"]) ? "active" : ""}
            onClick={() => navigate("/users")}>
            <FaUserShield className="icon" />
            Users
          </li>
        )}

        <li>
          <FaCog className="icon" />
          Settings
        </li>

      </ul>

    </div>
  );
}

export default Sidebar;