import { GoogleLogin } from '@react-oauth/google';
import { googleCallback } from '../api/authApi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleOAuth({ text }) {
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSuccess = async (successResponse) => {
        setError(null);
        try {
            const response = await googleCallback(successResponse.credential);
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                navigate('/');
            }
        } catch (error) {
            setError(error.response?.data?.errors?.[0]?.msg || 'An error occurred');
        }
    };

    return (
        <div className="flex flex-col items-center mt-6" style={{ width: '100%' }}>
            <GoogleLogin 
                hosted_domain="rit.edu" 
                onSuccess={handleSuccess} 
                onError={() => {console.log('hi')}} 
                text={text}
                width="100%"
            />
            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );  
}

export default GoogleOAuth;