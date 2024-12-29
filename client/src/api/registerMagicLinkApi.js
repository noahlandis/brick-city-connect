import { api } from './config';

export async function sendRegisterMagicLink(email) {
    return await api.post('/send-register-magic-link', { email });
    
};

export async function verifyToken(token) {
    const response = await api.get(`/verify-token?token=${token}`);
    return response;
};