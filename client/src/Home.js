import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import VideocamIcon from '@mui/icons-material/Videocam';

function Home() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();

    async function logout() {
        clientLogout();
        navigate('/login');
    }

    return (
        <div>
            <Button 
                variant="contained"
                startIcon={<VideocamIcon />}
                onClick={() => navigate('/chat')}
                sx={{
                    backgroundColor: '#F76902',
                    '&:hover': {
                        backgroundColor: '#d55a02',
                    },
                    padding: '12px'
                }}
            >
                Start Chatting
            </Button>
            <Button 
                variant="outlined"
                onClick={logout}
                sx={{
                    color: 'black',
                    borderColor: 'black',
                    '&:hover': {
                        borderColor: '#333',
                        backgroundColor: '#f5f5f5'
                    }
                }}
            >
                Logout
            </Button>
        </div>
    );
}

export default Home;