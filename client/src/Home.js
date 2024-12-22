import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
        <div>
<<<<<<< HEAD
            <h1>Home</h1>
            <button onClick={() => navigate('/chat')}>
=======
            <h1>Home, automated deployment works!</h1>
            <button onClick={() => navigate('/room')}>
>>>>>>> c129b2d96da2e8d4df2f054fcfbafa5c0e0aa7f8
                Start Chatting
            </button>
        </div>
    );
}

export default Home;
