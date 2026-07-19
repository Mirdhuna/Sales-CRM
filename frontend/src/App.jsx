import { Routes, Route, Navigate } from "react-router-dom";

import "./App.css";

import ProtectedRoute from "./components/protectedRoute";

import Accounts from "./pages/Accounts";
import AddAccount from "./pages/AddAccount";
import EditAccount from "./pages/EditAccount";
import Contacts from "./pages/Contacts";
import AddContact from "./pages/AddContact";
import EditContact from "./pages/EditContact";
import Leads from "./pages/Leads";
import AddLead from "./pages/AddLead";
import EditLead from "./pages/EditLead";
import Opportunities from "./pages/Opportunities";
import AddOpportunity from "./pages/AddOpportunities";
import EditOpportunity from "./pages/EditOpportunities";
import Quotes from "./pages/quotes";
import EditQuotes from "./pages/EditQuotes";
import Orders from "./pages/Orders";
import EditOrder from "./pages/EditOrders";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProducts";
import EditProduct from "./pages/EditProducts";
import InvoiceList from "./pages/Invoice";
import EditInvoice from "./pages/EditInvoice";
import SalesLeads from "./pages/SalesLeads";
import AddSalesLead from "./pages/AddSalesLeads";
import EditSalesLead from "./pages/EditSalesLead";
import Competitors from "./pages/Competitors";
import AddCompetitor from "./pages/AddCompetitor";
import EditCompetitor from "./pages/EditCompetitor";
import LoginPage from "./pages/Login";
import AddUser from "./pages/AddUser";
import Dashboard from "./pages/dashboard";
import UserList from "./pages/UsersList";
import EditUser from "./pages/EditUser";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import ViewAccount from "./pages/Customer360";

function App() {
  return (
    <Routes>

      {/* ── Public routes (no login needed) ───────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* ── Root redirect → salesLeads (ProtectedRoute handles bounce) ────── */}
      <Route path="/" element={<Navigate to="/salesLeads" replace />} />

      {/* ── Protected routes ───────────────────────────────────────────────── */}

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Users */}
      <Route path="/users"           element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/users/add"       element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
      <Route path="/users/edit/:id"  element={<ProtectedRoute><EditUser /></ProtectedRoute>} />

      {/* Accounts */}
      <Route path="/accounts"          element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
      <Route path="/add-account"       element={<ProtectedRoute><AddAccount /></ProtectedRoute>} />
      <Route path="/edit-account/:id"  element={<ProtectedRoute><EditAccount /></ProtectedRoute>} />
      <Route path="/view-account/:id" element={<ProtectedRoute><ViewAccount/></ProtectedRoute>}/>

      {/* Contacts */}
      <Route path="/contacts"          element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/add-contact"       element={<ProtectedRoute><AddContact /></ProtectedRoute>} />
      <Route path="/edit-contact/:id"  element={<ProtectedRoute><EditContact /></ProtectedRoute>} />

      {/* Leads */}
      <Route path="/leads"         element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/add-lead"      element={<ProtectedRoute><AddLead /></ProtectedRoute>} />
      <Route path="/edit-lead/:id" element={<ProtectedRoute><EditLead /></ProtectedRoute>} />

      {/* Opportunities */}
      <Route path="/opportunities"        element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/add-opportunity"      element={<ProtectedRoute><AddOpportunity /></ProtectedRoute>} />
      <Route path="/edit-opportunity/:id" element={<ProtectedRoute><EditOpportunity /></ProtectedRoute>} />

      {/* Quotes */}
      <Route path="/quotes"          element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
      <Route path="/quotes/edit/:id" element={<ProtectedRoute><EditQuotes /></ProtectedRoute>} />

      {/* Orders */}
      <Route path="/orders"          element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/orders/edit/:id" element={<ProtectedRoute><EditOrder /></ProtectedRoute>} />

      {/* Products */}
      <Route path="/products"          element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/products/add"      element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
      <Route path="/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />

      {/* Invoices */}
      <Route path="/invoices"          element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
      <Route path="/invoices/edit/:id" element={<ProtectedRoute><EditInvoice /></ProtectedRoute>} />

      {/* Sales Leads */}
      <Route path="/salesLeads"          element={<ProtectedRoute><SalesLeads /></ProtectedRoute>} />
      <Route path="/add-sales-lead"      element={<ProtectedRoute><AddSalesLead /></ProtectedRoute>} />
      <Route path="/edit-sales-lead/:id" element={<ProtectedRoute><EditSalesLead /></ProtectedRoute>} />

      {/* Competitors */}
      <Route path="/competitors"          element={<ProtectedRoute><Competitors /></ProtectedRoute>} />
      <Route path="/competitors/add"      element={<ProtectedRoute><AddCompetitor /></ProtectedRoute>} />
      <Route path="/competitors/edit/:id" element={<ProtectedRoute><EditCompetitor /></ProtectedRoute>} />

      {/* ── Catch-all: unknown URL → login ────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;