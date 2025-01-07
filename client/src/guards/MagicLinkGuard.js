import { redirect } from 'react-router-dom';
import { verifyToken } from '../api/magicLinkApi';

export function createMagicLinkLoader(redirectPath) {
    return async function loader({ request }) {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        
        if (!token) {
            throw redirect(redirectPath);
        }
        
        try {
            const response = await verifyToken(token);
            return { username: response.data.username };
        } catch (error) {
            throw redirect(`${redirectPath}?error=INVALID_TOKEN`);
        }
    }
}

// Create specific loaders
export const registerLoader = createMagicLinkLoader('/register');
export const forgotPasswordLoader = createMagicLinkLoader('/forgot-password');