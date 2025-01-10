import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    async function logout() {
        localStorage.removeItem('token');
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