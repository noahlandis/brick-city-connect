import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LogoutIcon from '@mui/icons-material/Logout';
import { Tooltip } from '@mui/material';

function AuthLayout() {
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
                    <LogoutIcon sx={{ color: '#F76902' }} />
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
