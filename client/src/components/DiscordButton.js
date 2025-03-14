import { Button } from '@mui/material';
import { FaDiscord } from 'react-icons/fa';

export default function DiscordButton({ text }) {
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
                fontWeight: 550,
                borderRadius: '4px',
                textTransform: 'none',
                padding: '0.6rem 1rem',
                fontSize: '0.800rem',
                '&:hover': {
                    backgroundColor: '#4752C4'
                },
                whiteSpace: 'nowrap'
            }}
        >
            {text}
        </Button>
    );
}