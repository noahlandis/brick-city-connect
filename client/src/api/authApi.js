import { api } from './config';

export async function register(email, password, confirmPassword) {
    return await api.post('/register', { email, password, confirmPassword });
    
};

export async function verifyToken(token) {
    const response = await api.get(`/verify-token?token=${token}`);
    return response;
};