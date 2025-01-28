import { useTheme, useMediaQuery, Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

function Backgrounds() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const mockBackgrounds = [
        { id: 0, url: null, name: 'None' },
        { id: 1, url: '/rit.jpg', name: 'Rit' },
        { id: 2, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', name: 'Beach' },
        { id: 3, url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0', name: 'Mountains' },
        { id: 4, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', name: 'Beach' },
        { id: 5, url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0', name: 'Mountains' },
        { id: 6, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', name: 'Beach' },
    ];

    return (
        <Box
            sx={{
                display: 'flex',
                gap: isMobile ? 1.5 : 2,
                overflowX: 'auto',
                padding: isMobile ? '8px' : '16px',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                    height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.grey[400],
                    borderRadius: '4px',
                },
            }}
        >
            {mockBackgrounds.map((background) => (
                <Box
                    key={background.id}
                    sx={{
                        flex: '0 0 auto',
                        width: isMobile ? '140px' : '200px',
                        position: 'relative',
                        aspectRatio: '16/9',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: background.url ? 'transparent' : 'rgba(0, 0, 0, 0.1)', // Background color for 'None'
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {background.url ? (
                        <img
                            src={background.url}
                            alt={background.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <BlockIcon
                            sx={{
                                fontSize: '3rem',
                                color: theme.palette.grey[600],
                            }}
                        />
                    )}
                    {background.url && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                padding: '8px',
                                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
                                color: 'white',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                            }}
                        >
                            {background.name}
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
}

export default Backgrounds;
