import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

function Home() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();

    async function logout() {
        clientLogout();
        navigate('/login');
    }

    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            height: '100%'
        }}>
            <Button 
                variant="contained"
                startIcon={<ChatIcon />}
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
        </Box>
    );
}

export default Home;