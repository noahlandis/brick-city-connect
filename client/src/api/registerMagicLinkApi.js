import axios from 'axios';

export async function sendRegisterMagicLink(email) {
    const response = await axios.post('http://localhost:3000/send-register-magic-link', { email });
    return response.data;
};

export async function verifyToken(token) {
    const response = await axios.get(`http://localhost:3000/verify-token?token=${token}`);
    return response.data;
};