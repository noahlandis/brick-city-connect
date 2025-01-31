import { api } from './config';

export async function getBackgrounds(userID) {
    return await api.get(`/users/${userID}/backgrounds`);
}

export async function getUser(userID) {
    return await api.get(`/users/${userID}`);
}