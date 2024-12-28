import { api } from './config';

export async function sendRegisterMagicLink(email) {
    const response = await api.post('/send-register-magic-link', { email });
    return response.data;
};

export async function verifyToken(token) {
    const response = await api.get(`/verify-token?token=${token}`);
    return response.data;
};