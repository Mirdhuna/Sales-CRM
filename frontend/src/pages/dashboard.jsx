import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import axios from "axios";
import "../css/dashboard.css";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Line, LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#ef4444", "#22c55e"];
const CONVERSION_COLORS = {
  Quotes: "#8b5cf6",
  Orders: "#f59e0b",
  Invoices: "#06b6d4"
};

const BASE = "http://localhost:5000";

function Dashboard() {
  const [data, setData] = useState(null);
  const [recentOpportunities, setRecentOpportunities] = useState([]);
  const [leadStatusData, setLeadStatusData] = useState([]);
  const [opportunityStatusData, setOpportunityStatusData] = useState([]);
  const [conversionData, setConversionData] = useState(null);
  const [salesByAccount, setSalesByAccount] = useState([]);
  const [salesByProduct, setSalesByProduct] = useState([]);

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [filterError, setFilterError] = useState("");

  // Stable account list — seeded once from the initial unfiltered fetch
  // so the dropdown never empties when filters are applied
  const [allAccounts, setAllAccounts] = useState([]);

  // Core fetch — accepts optional filter params
  const fetchDashboardData = async (params = {}) => {
    try {
      // Build query string from non-empty params
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
      ).toString();
      const qs = query ? `?${query}` : "";

      const [
        overviewRes,
        opportunitiesRes,
        leadStatusRes,
        opportunityStatusRes,
        conversionRes,
        salesByAccountRes,
        salesByProductRes
      ] = await Promise.all([
        axios.get(`${BASE}/dashboard/overview${qs}`),
        axios.get(`${BASE}/dashboard/recent-opportunities${qs}`),
        axios.get(`${BASE}/dashboard/lead-status${qs}`),
        axios.get(`${BASE}/dashboard/opportunity-status${qs}`),
        axios.get(`${BASE}/dashboard/sales-conversion${qs}`),
        axios.get(`${BASE}/dashboard/sales-by-account${qs}`),
        axios.get(`${BASE}/dashboard/sales-by-product${qs}`)
      ]);

      setData(overviewRes.data);
      setRecentOpportunities(opportunitiesRes.data);
      setLeadStatusData(leadStatusRes.data);
      setOpportunityStatusData(opportunityStatusRes.data);
      setConversionData(conversionRes.data);
      setSalesByAccount(salesByAccountRes.data);
      setSalesByProduct(salesByProductRes.data);
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  // Initial load — no filters; also seeds the account dropdown
  useEffect(() => {
    const init = async () => {
      await fetchDashboardData();
    };
    init();
  }, []);

  // Seed allAccounts once after initial salesByAccount loads
  useEffect(() => {
    if (allAccounts.length === 0 && salesByAccount.length > 0) {
      setAllAccounts(salesByAccount.map((a) => ({ account_id: a.account_id, account_name: a.account_name })));
    }
  }, [salesByAccount]);

  const handleApplyFilter = () => {
    // Validate date range if both are filled
    if (fromDate && toDate && fromDate > toDate) {
      setFilterError("'From Date' cannot be after 'To Date'.");
      return;
    }
    setFilterError("");
    fetchDashboardData({
      from_date: fromDate,
      to_date: toDate,
      account_id: selectedAccount
    });
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setSelectedAccount("");
    setFilterError("");
    fetchDashboardData();
  };

  if (!data) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // ── Derived values ────────────────────────────────────────────────
  const totalLeads = leadStatusData.reduce((sum, item) => sum + item.count, 0);
  const qualified = leadStatusData.find((i) => i.status === "Qualified")?.count || 0;
  const disqualified = leadStatusData.find((i) => i.status === "Disqualified")?.count || 0;
  const qualifiedPercentage = totalLeads > 0 ? ((qualified / totalLeads) * 100).toFixed(1) : 0;
  const disqualifiedPercentage = totalLeads > 0 ? ((disqualified / totalLeads) * 100).toFixed(1) : 0;

  const salesConversionChart = conversionData
    ? [
        { stage: "Quotes", count: conversionData.quotes },
        { stage: "Orders", count: conversionData.orders_count },
        { stage: "Invoices", count: conversionData.invoices }
      ]
    : [];

  const totalQuotes = conversionData?.quotes || 0;
  const totalOrders = conversionData?.orders_count || 0;
  const totalInvoices = conversionData?.invoices || 0;

  const top5Products = salesByProduct
    ? [...salesByProduct].sort((a, b) => b.total_sales - a.total_sales).slice(0, 5)
    : [];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-container">
        <Topbar title="Dashboard" />

        {/* ── FILTERS ─────────────────────────────────────────────── */}
        <div className="dashboard-filters">
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              className="filter-input"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              className="filter-input"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Account</label>
            <select
              className="filter-select"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">All Accounts</option>
              {allAccounts.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.account_name}
                </option>
              ))}
            </select>
          </div>

          <button className="filter-btn" onClick={handleApplyFilter}>
            Apply Filter
          </button>

          {/* Clear only shows when any filter is active */}
          {(fromDate || toDate || selectedAccount) && (
            <button className="filter-btn filter-btn-clear" onClick={handleClearFilter}>
              Clear
            </button>
          )}
        </div>

        {filterError && (
          <p className="filter-error">{filterError}</p>
        )}

        {/* Active filter indicator */}
        {(fromDate || toDate || selectedAccount) && (
          <div className="filter-active-bar">
            Showing filtered results
            {fromDate && ` · From: ${fromDate}`}
            {toDate && ` · To: ${toDate}`}
            {selectedAccount && ` · Account: ${allAccounts.find((a) => String(a.account_id) === String(selectedAccount))?.account_name || selectedAccount}`}
          </div>
        )}

        {/* ── CARDS ────────────────────────────────────────────────── */}
        <div className="dashboard-cards">
          <div className="dashboard-card card-leads">
            <h4>Total Leads</h4>
            <h2>{data.totalLeads}</h2>
          </div>
          <div className="dashboard-card card-qualified">
            <h4>Qualified Leads</h4>
            <h2>{data.qualifiedLeads}</h2>
          </div>
          <div className="dashboard-card card-open">
            <h4>Open Opportunities</h4>
            <h2>{data.openOpportunities}</h2>
          </div>
          <div className="dashboard-card card-won">
            <h4>Won Opportunities</h4>
            <h2>{data.wonOpportunities}</h2>
          </div>
          <div className="dashboard-card card-revenue">
            <h4>Revenue</h4>
            <h2>₹{Number(data.revenue).toLocaleString()}</h2>
          </div>
        </div>

        {/* ── CHARTS ROW 1 ─────────────────────────────────────────── */}
        <div className="dashboard-charts">
          <div className="chart-box">
            <h3>Lead Qualification</h3>
            <div className="lead-chart-container">
              <div className="lead-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                    >
                      {leadStatusData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lead-summary">
                <h4>Total Leads</h4>
                <h2>{totalLeads}</h2>
                <div className="summary-item-t1 qualified">
                  <span>● Qualified</span>
                  <strong>{qualified} ({qualifiedPercentage}%)</strong>
                </div>
                <div className="summary-item-t1 disqualified">
                  <span>● Disqualified</span>
                  <strong>{disqualified} ({disqualifiedPercentage}%)</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-box">
            <h3>Opportunity Status</h3>
            <br />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={opportunityStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {opportunityStatusData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.status === "Won"
                          ? "#22c55e"
                          : entry.status === "Lost"
                          ? "#ef4444"
                          : entry.status === "New"
                          ? "#3b82f6"
                          : "#6366f1"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box full-width-chart">
            <h3>Sales Conversion Funnel</h3>
            <br />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesConversionChart}>
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {salesConversionChart.map((entry, index) => (
                    <Cell key={index} fill={CONVERSION_COLORS[entry.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── CHARTS ROW 2 ─────────────────────────────────────────── */}
        <div className="dashboard-charts c2">
          <div className="chart-box full-width-chart">
            <h3>Sales by Account</h3>
            <br />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByAccount}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="account_name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_sales" radius={[8, 8, 0, 0]}>
                  {salesByAccount.map((entry, index) => (
                    <Cell key={index} fill="#4f46e5" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box full-width-chart">
            <h3>Sales by Product</h3>
            <br />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={top5Products.length ? top5Products : salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total_sales"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;