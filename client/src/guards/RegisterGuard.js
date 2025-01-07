import { redirect } from 'react-router-dom';
import { verifyToken } from '../api/magicLinkApi';

export async function loader({ request }) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw redirect('/register');
    }
    
    try {
        const response = await verifyToken(token);
        return { username: response.data.username };
    } catch (error) {
        throw redirect('/register?error=INVALID_TOKEN');
    }
}