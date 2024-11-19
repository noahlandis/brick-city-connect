import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Home, automated deployment works!</h1>
            <button onClick={() => navigate('/room')}>
                Start Chatting
            </button>
        </div>
    );
}

export default Home;
