import axios from 'axios';


export const api = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}/api`
});

export const authenticatedApi = (token) => {
    return axios.create({
        baseURL: `${process.env.REACT_APP_SERVER_URL}/api`,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};