import { Button } from '@mui/material';
import { FaDiscord } from 'react-icons/fa';

export default function DiscordButton() {
    return (
        <Button
            variant="contained"
            onClick={() => {/* Add your Discord OAuth logic here */ }}
            startIcon={
                <FaDiscord />
            }
            sx={{
                width: '100%',
                backgroundColor: '#5865F2',
                color: 'white',
                fontFamily: '"Helvetica Neue"',
                fontWeight: 500,
                borderRadius: '8px',
                textTransform: 'none',
                padding: '0.5rem 0',
                '&:hover': {
                    backgroundColor: '#4752C4'
                }
            }}
        >
            Continue with Discord
        </Button>
    );
}