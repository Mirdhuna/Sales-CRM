import axios from "axios";

const API_URL = "http://localhost:5000/auth";

export const login = async (credentials) => {
    const response = await axios.post(
        `${API_URL}/login`,
        credentials
    );

    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const getUser = () => {
    return JSON.parse(localStorage.getItem("user"));
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};

export const isAdmin = () => {

    const user = getUser();

    return user?.role === "Admin";

};