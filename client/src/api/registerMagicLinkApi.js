import { api } from './config';

export async function sendRegisterMagicLink(username) {
    return await api.post('/send-register-magic-link', { username });
};

export async function verifyToken(token) {
    return await api.get(`/verify-token?token=${token}`);
};