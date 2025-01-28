import { useTheme, useMediaQuery, Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';

function Backgrounds({ onSelect, selectedBackground }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const mockBackgrounds = [
        { id: 0, url: null, name: 'None', locked: false },
        { id: 1, url: '/rit.jpg', name: 'Rit', locked: false },
        { id: 2, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', name: 'Beach', locked: true },
        { id: 3, url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0', name: 'Mountains', locked: false },
    ];

    return (
        <Box
            sx={{
                display: 'flex',
                gap: isMobile ? 1.5 : 2,
                overflowX: 'auto',
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
                    onClick={() => onSelect(background)}
                    sx={{
                        flex: '0 0 auto',
                        width: isMobile ? '140px' : '200px',
                        position: 'relative',
                        aspectRatio: '16/9',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: background.locked ? 'not-allowed' : 'pointer',
                        backgroundColor: background.url ? 'transparent' : 'rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: selectedBackground === (background.url || 'none') ? '3px solid #F76902' : 'none',
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
                    ) : null}
                    {background.locked && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                            }}
                        >
                            <LockIcon
                                sx={{
                                    fontSize: '3rem',
                                    color: 'white',
                                }}
                            />
                        </Box>
                    )}
                    {!background.locked && background.url && (
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
                                zIndex: 2,
                            }}
                        >
                            {background.name}
                        </Box>
                    )}
                    {!background.url && !background.locked && (
                        <BlockIcon
                            sx={{
                                fontSize: '3rem',
                                color: theme.palette.grey[600],
                            }}
                        />
                    )}
                </Box>
            ))}
        </Box>
    );
}

export default Backgrounds;
