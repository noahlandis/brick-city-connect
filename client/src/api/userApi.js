import { authenticatedApi } from './config';

export async function getBackgrounds(userID) {
    const apiClient = authenticatedApi(localStorage.getItem('token'));
    return await apiClient.get(`/users/${userID}/backgrounds`);
}

export async function getUser(userID) {
    const apiClient = authenticatedApi(localStorage.getItem('token'));
    return await apiClient.get(`/users/${userID}`);
}