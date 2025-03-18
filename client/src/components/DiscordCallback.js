import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discordCallback } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function DiscordCallback() {
    const { clientLogin } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const hasCalledback = useRef(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (error) {
            setIsLoading(false);
            navigate('/login');
            return;
        }
        async function fetchData() {
            if (code && !hasCalledback.current) {
                hasCalledback.current = true;
                try {
                    const response = await discordCallback(code);
                    if (response.status === 200 || response.status === 201) {
                        clientLogin(response.data);
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Discord callback error:', error);
                    navigate('/login');
                }
                setIsLoading(false);
            }
        }
        fetchData();
    }, [code, clientLogin, navigate]);

    return isLoading ? <div>Loading...</div> : null;
}

export default DiscordCallback;