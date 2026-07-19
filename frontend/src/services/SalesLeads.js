import axios from "axios";

const API_URL = "http://localhost:5000/salesLeads";

export const getSalesLeads = () => axios.get(API_URL);

export const getSalesLeadById = (id) =>
    axios.get(`${API_URL}/${id}`);

export const addSalesLead = (data) =>
    axios.post(API_URL, data);

export const updateSalesLead = (id, data) =>
    axios.put(`${API_URL}/${id}`, data);

export const deleteSalesLead = (id) =>
    axios.delete(`${API_URL}/${id}`);

export const qualifySalesLead = async (id) => {
    const response = await axios.put(
        `${API_URL}/${id}/qualify`
    );

    return response.data;
};