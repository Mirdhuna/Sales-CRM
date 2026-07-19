import API from "./api";

// GET ALL QUOTES
export const getQuotes = async () => {
    try {
        const res = await API.get("/quotes");
        return res.data;
    } catch (err) {
        console.error("Error fetching quotes:", err);
        throw err;
    }
};

// GET QUOTE BY ID
export const getQuoteById = async (id) => {
    try {
        const res = await API.get(`/quotes/${id}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching quote:", err);
        throw err;
    }
};

// CREATE QUOTE
export const createQuote = async (data) => {
    try {
        const res = await API.post("/quotes", data);
        return res.data;
    } catch (err) {
        console.error("Error creating quote:", err);
        throw err;
    }
};

// UPDATE QUOTE
export const updateQuote = async (id, data) => {
    try {
        const res = await API.put(`/quotes/${id}`, data);
        return res.data;
    } catch (err) {
        console.error("Error updating quote:", err);
        throw err;
    }
};

// DELETE QUOTE
export const deleteQuote = async (id) => {
    try {
        const res = await API.delete(`/quotes/${id}`);
        return res.data;
    } catch (err) {
        console.error("Error deleting quote:", err);
        throw err;
    }
};

// CHANGE STATUS
export const updateQuoteStatus = async (id, status) => {
    try {
        const res = await API.patch(`/quotes/${id}/status`, { status });
        return res.data;
    } catch (err) {
        console.error("Error updating quote status:", err);
        throw err;
    }
};