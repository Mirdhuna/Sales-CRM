import axios from "axios";

const API = "http://localhost:5000/leads";

export const getLeads = () => axios.get(API);

export const getLeadById = (id) =>
    axios.get(`${API}/${id}`);

export const createLead = (data) =>
    axios.post(API, data);

export const updateLead = (id, data) =>
    axios.put(`${API}/${id}`, data);

export const deleteLead = (id) =>
    axios.delete(`${API}/${id}`);