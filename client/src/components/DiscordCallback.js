import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discordCallback } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function DiscordCallback() {
    const { clientLogin } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const hasCalledback = useRef(false);

    useEffect(() => {
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
            }
        }
        fetchData();
    }, [code, clientLogin, navigate]);

    return null;
}

export default DiscordCallback;