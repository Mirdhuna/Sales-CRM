import axios from "axios";

const API_URL = "http://localhost:5000/users";

// ===================== GET TOKEN =====================
const getAuthConfig = () => {

    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

};

// ===================== GET ALL USERS =====================
export const getUsers = async () => {

    try {

        const res = await axios.get(
            API_URL,
            getAuthConfig()
        );

        return res.data;

    } catch (err) {

        console.error(
            "Error fetching users:",
            err
        );

        throw err;

    }

};

// ===================== GET USER BY ID =====================
export const getUserById = async (id) => {

    try {

        const res = await axios.get(
            `${API_URL}/${id}`,
            getAuthConfig()
        );

        return res.data;

    } catch (err) {

        console.error(
            "Error fetching user:",
            err
        );

        throw err;

    }

};

// ===================== CREATE USER =====================
export const createUser = async (data) => {

    try {

        const res = await axios.post(
            API_URL,
            data,
            getAuthConfig()
        );

        return res.data;

    } catch (err) {

        console.error(
            "Error creating user:",
            err
        );

        throw err;

    }

};

// ===================== UPDATE USER =====================
export const updateUser = async (
    id,
    data
) => {

    try {

        const res = await axios.put(
            `${API_URL}/${id}`,
            data,
            getAuthConfig()
        );

        return res.data;

    } catch (err) {

        console.error(
            "Error updating user:",
            err
        );

        throw err;

    }

};

// ===================== TOGGLE USER STATUS =====================
export const toggleUserStatus = async (id) => {

    try {

        const res = await axios.put(
            `${API_URL}/${id}/status`,
            {},
            getAuthConfig()
        );

        return res.data;

    } catch (err) {

        console.error(
            "Error updating user status:",
            err
        );

        throw err;

    }

};

export const deleteUser = async (id) => {

    try {

        const res = await axios.delete(

            `${API_URL}/${id}`,

            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        return res.data;

    } catch (error) {

        console.error(
            "Error deleting user:",
            error
        );

        throw error;

    }

};

export const checkPhoneExists = async (phone) => {
    const res = await axios.get(`http://localhost:5000/users/check-phone/${phone}`);
    return res.data;
};