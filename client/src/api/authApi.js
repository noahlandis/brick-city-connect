import { api } from './config';

export async function register(username, password, confirmPassword) {
    return await api.post('/register', { username, password, confirmPassword });
    
};

export async function verifyToken(token) {
    const response = await api.get(`/verify-token?token=${token}`);
    return response;
};