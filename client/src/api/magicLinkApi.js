import { api } from './config';

export async function sendRegisterMagicLink(username) {
    return await api.post('/send-register-magic-link', { username });
};

export async function sendForgotPasswordMagicLink(username) {
    return await api.post('/send-forgot-password-magic-link', { username });
};

export async function verifyToken(token, tokenType) {
    return await api.get(`/verify-token?token=${token}&type=${tokenType}`);
};