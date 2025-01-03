import { redirect } from 'react-router-dom';
import { verifyToken } from '../api/registerMagicLinkApi';

export async function loader({ request }) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw redirect('/register');
    }
    
    const response = await verifyToken(token);
    if (response.error) {
      throw redirect('/register');
    }
    
    return { username: response.data.username };
}