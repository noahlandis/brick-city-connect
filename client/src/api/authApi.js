import { api } from './config';

export async function register(username, password, confirmPassword) {
    return await api.post('/register', { username, password, confirmPassword });
};

export async function login(username, password) {
    return await api.post('/login', { username, password });
};

