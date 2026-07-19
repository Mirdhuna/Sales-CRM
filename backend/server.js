require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Sales CRM Backend Running");
});

const accountRoutes = require("./routes/accounts");
app.use("/accounts", accountRoutes);

const contactsRoutes = require("./routes/contacts");
app.use("/contacts", contactsRoutes);

const leadsRoutes = require("./routes/leads");
app.use("/leads", leadsRoutes);

const opportunitiesRoutes = require("./routes/opportunities");
app.use("/opportunities", opportunitiesRoutes);

const productRoutes = require("./routes/products");
app.use("/products", productRoutes);

const quoteRoutes = require("./routes/quotes");
app.use("/quotes", quoteRoutes);

const orderRoutes = require("./routes/orders");
app.use("/orders", orderRoutes);

const invoiceRoutes = require("./routes/invoices");
app.use("/invoices", invoiceRoutes);

const salesLeadRoutes = require("./routes/salesLeads");
app.use("/salesLeads", salesLeadRoutes);

const competitorRoute = require("./routes/competitors");
app.use("/competitors", competitorRoute);

// FIX: was "/login" — loginService.js calls "/auth/login", so must be "/auth"
const authRoutes = require("./routes/login");
app.use("/auth", authRoutes);

const userRoutes = require("./routes/user");
app.use("/users", userRoutes);

const dashboardRouter = require("./routes/dashboard");
app.use("/dashboard",dashboardRouter)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});