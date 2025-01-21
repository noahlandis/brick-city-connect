import { Typography, Divider, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <Box sx={{ width: '100%' }}>
            <Divider sx={{ marginY: 2 }} />
            
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap'
            }}>
                <Link to="/terms" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Terms & Conditions
                </Link>
                <Link to="/privacy" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Privacy Policy
                </Link>
                <Link to="/contact" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Contact Us
                </Link>
            </Box>

            <Typography 
                variant="caption" 
                sx={{
                    color: '#666',
                    textAlign: 'center',
                    display: 'block',
                    fontSize: '0.7rem'
                }}
            >
                © {new Date().getFullYear()} Brick City Connect. All rights reserved.
            </Typography>
        </Box>
    );
}

export default Footer;
