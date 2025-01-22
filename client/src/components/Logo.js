import { Box, Typography, Avatar } from '@mui/material';

function Logo({ sx = {} }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
                ...sx
            }}
        >
            <Avatar
                src="/tiger.png"
                alt="RIT Tiger Logo"
                sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                }}
            />
            <Typography
                variant="h5"
                sx={{
                    color: "#F76902",
                    fontFamily: '"Helvetica Neue"',
                    fontWeight: 'bold',
                    fontSize: {
                        xs: '1.5rem',
                        sm: '1.8rem'
                    },
                    whiteSpace: 'nowrap',
                }}
            >
                Brick City Connect
            </Typography>
        </Box>
    );
}

export default Logo;
