import axios from "axios";

const API_URL = "http://localhost:5000/orders";

export const getOrders = async () => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const getOrderById = async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
};

export const closeOrder = async (id) => {
    const res = await axios.patch(`${API_URL}/${id}/close`);
    return res.data;
};

// FIX: Added missing (id, data) parameters
export const updateOrder = async (id, data) => {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
};

export const createOrderFromQuote = async (quoteId) => {
    const res = await axios.post(`${API_URL}/from-quote`, { quoteId });
    return res.data;
};

export const deleteOrder = async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
};