import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
function Home() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();

    async function logout() {
        clientLogout();
        navigate('/login');
    }

    return (
        <div>
            <h1>Home</h1>
            <button onClick={() => navigate('/chat')}>
                Start Chatting
            </button>
            <button onClick={() => logout()}>
                logout
            </button>
        </div>
    );
}

export default Home;