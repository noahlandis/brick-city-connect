import { Typography, Divider, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function Footer({ inline = false }) {
    return (
        <Box sx={{ width: '100%' }}>
            <Divider sx={{ marginY: 2 }} />

            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: inline ? 0 : '0.5rem',
                flexWrap: inline ? {
                    xs: 'wrap',  // On mobile: wrap
                    sm: 'nowrap' // On desktop: nowrap
                } : 'wrap',
                alignItems: 'center'
            }}>
                <Link to="/terms" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Terms & Conditions
                </Link>
                <Link to="/privacy" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Privacy Policy
                </Link>
                <a
                    href="mailto:brickcityconnect@gmail.com"
                    style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}
                >
                    Contact Us
                </a>

                {inline && (
                    <>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#666',
                                fontSize: '0.7rem'
                            }}
                        >
                            © {new Date().getFullYear()} Brick City Connect. All rights reserved.
                        </Typography>
                    </>
                )}

                <a
                    href={process.env.REACT_APP_DISCORD_REDIRECT_URI}
                    style={{ color: '#f76902', fontSize: '0.75rem', textDecoration: 'none' }}
                >
                    Discord
                </a>
            </Box>

            {!inline && (
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
            )}
        </Box>
    );
}

export default Footer;
