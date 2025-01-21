import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

function AuthLayout() {
    return (
        <Box sx={{ 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                padding: 2,
                backgroundColor: 'white'
            }}>
                <Logo />
            </Box>

            {/* Main Content */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                minHeight: 0
            }}>
                <Outlet />
            </Box>

            {/* Footer */}
            <Box sx={{ width: '100%', mt: 'auto', pb: 2 }}>
                <Footer />
            </Box>
        </Box>
    );
}

export default AuthLayout;
