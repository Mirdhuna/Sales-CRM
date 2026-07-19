import React from "react";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isAdmin = currentUser?.role === "Admin";

    // If not admin, silently redirect to dashboard
    return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

export default AdminRoute;