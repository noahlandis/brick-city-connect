import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, Typography, Avatar, Button, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import Footer from './components/Footer';

function Home() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();

    async function logout() {
        clientLogout();
        navigate('/login');
    }

    return (
        <Box sx={{ 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: 2,
                backgroundColor: 'white'
            }}>
                <Avatar
                    src="/tiger.png"
                    alt="RIT Tiger Logo"
                    sx={{
                        width: 60,
                        height: 60,
                    }}
                />
                <Typography
                    variant="h5"
                    sx={{
                        color: "#F76902",
                        fontFamily: '"Helvetica Neue"',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Brick City Connect
                </Typography>
            </Box>

            {/* Main Content */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
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

            {/* Footer */}
            <Box sx={{ width: '100%', mt: 'auto', pb: 2 }}>
                <Footer />
            </Box>
        </Box>
    );
}

export default Home;