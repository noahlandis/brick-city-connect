import { api } from './config';

export async function register(username, password, confirmPassword) {
    return await api.post('/register', { username, password, confirmPassword });
};

export async function login(username, password) {
    return await api.post('/login', { username, password });
};

export async function resetPassword(username, password, confirmPassword) {
    return await api.put('/reset-password', { username, password, confirmPassword });
};

export async function googleCallback(code) {
    return await api.post('/google-callback', { code });
};

export async function discordCallback(code) {
    return await api.post('/discord-callback', { code });
};

