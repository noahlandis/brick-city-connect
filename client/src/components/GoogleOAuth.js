import { GoogleLogin } from '@react-oauth/google';
import { googleCallback } from '../api/authApi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Bugsnag from '@bugsnag/js';
import ReactGA from 'react-ga4';

function GoogleOAuth({ text }) {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { clientLogin } = useAuth();
    const handleSuccess = async (successResponse) => {
        setError(null);
        try {
            const response = await googleCallback(successResponse.credential);
            if (response.status === 200 || response.status === 201) {
                clientLogin(response.data);
                navigate('/');

                if (response.status === 200) {
                    ReactGA.event({
                        category: 'Auth',
                        action: 'user_logged_in',
                        label: `username: ${response.data.user.username}, type: google`
                    });
                }
                else {
                    ReactGA.event({
                        category: 'Auth',
                        action: 'user_registered',
                        label: `username: ${response.data.user.username}, type: google`
                    });
                }
            }
        } catch (error) {
            setError(error.response?.data?.errors?.[0]?.msg || 'An error occurred');
        }
    };

    return (
        <div className="flex flex-col items-center" style={{ width: '100%' }}>
            <GoogleLogin 
                hosted_domain="rit.edu" 
                onSuccess={handleSuccess} 
                onError={() => {Bugsnag.notify(new Error('Google OAuth error'));}} 
                text={text}
                width="100%"
            />
            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );  
}

export default GoogleOAuth;