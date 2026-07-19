import axios from "axios";

const API_URL = "http://localhost:5000/competitors";

// FIX: separate URL for products — getProducts() was hitting /competitors (wrong)
const PRODUCTS_URL = "http://localhost:5000/products";

// ===================== GET ALL COMPETITORS =====================
export const getCompetitors = async () => {
    try {
        const res = await axios.get(API_URL);
        return res.data;
    } catch (err) {
        console.error("Error fetching competitors:", err);
        throw err;
    }
};

// ===================== GET COMPETITOR BY ID =====================
export const getCompetitorsById = async (id) => {
    try {
        const res = await axios.get(`${API_URL}/${id}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching competitor:", err);
        throw err;
    }
};

// ===================== CREATE COMPETITOR =====================
export const createCompetitor = async (data) => {
    try {
        const res = await axios.post(API_URL, data);
        return res.data;
    } catch (err) {
        console.error("Error creating competitor:", err);
        throw err;
    }
};

// ===================== UPDATE COMPETITOR =====================
export const updateCompetitor = async (id, data) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("Error updating competitor:", err);
        throw err;
    }
};

// ===================== DELETE COMPETITOR =====================
export const deleteCompetitor = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (err) {
        console.error("Error deleting competitor:", err);
        throw err;
    }
};

// ===================== ADD PRODUCT MAPPING =====================
export const addProductToCompetitor = async (competitorId, data) => {
    try {
        const res = await axios.post(`${API_URL}/${competitorId}/products`, data);
        return res.data;
    } catch (err) {
        console.error("Error adding product to competitor:", err);
        throw err;
    }
};

// ===================== UPDATE PRODUCT MAPPING =====================
export const updateProductOnCompetitor = async (competitorProductId, data) => {
    try {
        const res = await axios.put(`${API_URL}/products/${competitorProductId}`, data);
        return res.data;
    } catch (err) {
        console.error("Error updating competitor product:", err);
        throw err;
    }
};

// ===================== DELETE PRODUCT MAPPING =====================
// FIX: added try/catch — was missing, causing unhandled promise rejections
export const deleteProductFromCompetitor = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/products/${id}`);
        return res.data;
    } catch (err) {
        console.error("Error deleting competitor product:", err);
        throw err;
    }
};

// ===================== GET ALL PRODUCTS (for dropdown) =====================
// FIX: was hitting API_URL (/competitors) instead of /products
export const getProducts = async () => {
    try {
        const res = await axios.get(PRODUCTS_URL);
        return res.data;
    } catch (err) {
        console.error("Error fetching products:", err);
        throw err;
    }
};