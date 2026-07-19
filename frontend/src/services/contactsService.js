import axios from "axios";

const API_URL="http://localhost:5000/contacts";

export const getContacts = async () =>{
    const response = await axios.get(API_URL);
    return response.data;
};

export const deleteContact = async(id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
}

export const createContact = async(contactData)=>{
    const response = await axios.post(API_URL,contactData);
    return response.data;
}

export const updateContact = async(id,contactData)=>{
    const response =  await axios.put(`${API_URL}/${id}`,contactData);
    return response.data;
}

export const getContactById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};
