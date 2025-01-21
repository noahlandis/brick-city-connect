import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LogoutIcon from '@mui/icons-material/Logout';
import { Tooltip, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthLayout() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();

    const handleLogout = () => {
        clientLogout();
        navigate('/login');
    };

    return (
        <Box sx={{ 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 2.5rem',
        }}>
            {/* Header */}
            <Box sx={{
                padding: 2,
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Logo />
                <Tooltip title="Logout">
                        <IconButton 
                            onClick={handleLogout}
                            sx={{ 
                                color: '#F76902',
                                '&:hover': {
                                    backgroundColor: 'rgba(247, 105, 2, 0.1)'
                                }
                            }}
                        >
                            <LogoutIcon />
                    </IconButton>
                </Tooltip>

            </Box>

            {/* Main Content */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                minHeight: 0,
                width: '100%'
            }}>
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Outlet />
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ width: '100%', mt: 'auto', pb: 2 }}>
                <Footer inline={true} />
            </Box>
        </Box>
    );
}

export default AuthLayout;
