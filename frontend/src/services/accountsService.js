import API from "./api";


// ================= GET ALL ACCOUNTS =================

export const getAccounts = async () => {

    const res = await API.get("/accounts");

    return res.data;
};


// ================= GET ACCOUNT BY ID =================

export const getAccountById = async (id) => {

    const res = await API.get(`/accounts/${id}`);

    return res.data;
};


// ================= CREATE ACCOUNT =================

export const createAccount = async (data) => {

    const res = await API.post("/accounts", data);

    return res.data;
};


// ================= UPDATE ACCOUNT =================

export const updateAccount = async (id, data) => {

    const res = await API.put(`/accounts/${id}`, data);

    return res.data;
};


// ================= DELETE ACCOUNT =================

export const deleteAccount = async (id) => {

    const res = await API.delete(`/accounts/${id}`);

    return res.data;
};

