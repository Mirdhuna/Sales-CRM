// FIX 4: Removed unused `import API from "./api"` which caused a crash if ./api doesn't exist.
import axios from "axios";

const API_URL = "http://localhost:5000/opportunities";

export const getOpportunities = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getOpportunitiesById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createOpportunity = async (opportunityData) => {
    console.log("SERVICE DATA:", opportunityData);
    const response = await axios.post(API_URL, opportunityData);
    return response.data;
};

export const updateOpportunity = async (id, opportunityData) => {
    const response = await axios.put(`${API_URL}/${id}`, opportunityData);
    return response.data;
};

export const deleteOpportunity = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};


export const markOpportunityWon = async (id) => {
    const response = await axios.post(`${API_URL}/${id}/won`);
    return response.data; // returns { message, quote_id }
};

export const markOpportunityLost = async (id) => {
    const response = await axios.post(`${API_URL}/${id}/lost`);
    return response.data;
};
