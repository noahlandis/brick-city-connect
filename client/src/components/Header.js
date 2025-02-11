import { Box, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Header() {
    const { clientLogout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        clientLogout();
        navigate('/login');
    };

    return (
        <Box sx={{
            padding: 2,
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <Link to="/">
                <Logo />
            </Link>
            {user && (
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
            )}
        </Box>
    );
}

export default Header;