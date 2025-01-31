import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ERROR_CODES } from '../../utils/constants';
import { useModal } from '../../contexts/ModalContext';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useMediaQuery } from '@mui/material';
function Home() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showModal, hideModal } = useModal();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        // Clear the error parameter from URL if it exists
        const errorCode = searchParams.get('error');
        if (errorCode === ERROR_CODES.MEDIA_PERMISSION_DENIED) {
            // Clear the parameters first
            searchParams.delete('error');
            setSearchParams(searchParams);
            
            // Then show the modal
            showModal({
                title: "Camera and Microphone Access Required",
                message: "To use the chat feature, please allow access to your camera and microphone. Make sure your device is not muted. You can update these permissions in your browser settings.",
                actionText: "OK",
                useButton: true,
                onAction: hideModal
            });
        }
    }, [searchParams, setSearchParams, showModal, hideModal]);

    useEffect(() => {
        const isChatDisabled = searchParams.has('chat-disabled');
        const returnTime = searchParams.get('next-chat-time');
        
        if (isChatDisabled) {
            // Clear the parameters first
            searchParams.delete('chat-disabled');
            searchParams.delete('next-chat-time');
            setSearchParams(searchParams);
            
            const message = returnTime 
                ? `Chat is currently unavailable. Come back ${returnTime}. Hope to see you then!`
                : "Chat is currently unavailable. Please check back later!";
                
            showModal({
                title: "Come back later!",
                message: message,
                actionText: "Got it",
                useButton: true,
                onAction: hideModal
            });
        }
    }, [searchParams, setSearchParams, showModal, hideModal]);

    const mockBackgrounds = [
        { id: 1, name: 'Mountain View', url: 'https://picsum.photos/800/450?random=1' },
        { id: 2, name: 'Beach Sunset', url: 'https://picsum.photos/800/450?random=2' },
        { id: 3, name: 'City Night', url: 'https://picsum.photos/800/450?random=3' },
        { id: 4, name: 'Forest', url: 'https://picsum.photos/800/450?random=4' },
        { id: 5, name: 'Desert', url: 'https://picsum.photos/800/450?random=5' },
        { id: 6, name: 'Ocean', url: 'https://picsum.photos/800/450?random=6' },
    ];

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                width: '80%',
                margin: '0 auto',
                height: '80%',
            }}
        >
            {/* Top Section */}
            <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
            }}>
                {/* Username */}
                <Box sx={{ 
                    fontSize: isMobile ? '1.25rem' : '1.75rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: '#2c3e50',
                }}>
                    Welcome, {user.username}!
                </Box>

                {/* Level Progress Section */}
                <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <Box sx={{ 
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            fontWeight: '500',
                            color: '#2c3e50',
                        }}>
                            Level {user.level}
                        </Box>
                        <Box sx={{ 
                            fontSize: '0.875rem',
                            color: '#666',
                        }}>
                            {user.xp} / 1000 XP
                        </Box>
                    </Box>
                    
                    {/* XP Progress Bar */}
                    <Box
                        sx={{
                            width: '100%',
                            height: 8,
                            backgroundColor: '#f0f2f5',
                            borderRadius: 4,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                height: '100%',
                                background: 'linear-gradient(90deg, #F76902, #ff9248)',
                                width: `${(user.xp / 1000) * 100}%`,
                                borderRadius: 4,
                                transition: 'width 0.3s ease-in-out'
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Backgrounds Section */}
            <Box sx={{ flex: 1 }}>
                <Box sx={{ 
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '600',
                    color: '#2c3e50',
                    mb: 2
                }}>
                    Your Backgrounds
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile 
                            ? 'repeat(auto-fit, minmax(140px, 1fr))'
                            : 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: isMobile ? 1.5 : 2,
                    }}
                >
                    {mockBackgrounds.map((background) => (
                        <Box
                            key={background.id}
                            sx={{
                                position: 'relative',
                                aspectRatio: '16/9',
                                borderRadius: 2,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    '& .background-name': {
                                        opacity: 1,
                                    }
                                },
                            }}
                        >
                            <img
                                src={background.url}
                                alt={background.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <Box
                                className="background-name"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: isMobile ? 1 : 1.5,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                    color: 'white',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease-in-out',
                                    fontSize: isMobile ? '0.875rem' : '1rem'
                                }}
                            >
                                {background.name}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Bottom Chat Button */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                mt: 2
            }}>
                <Button 
                    variant="contained"
                    startIcon={<VideocamIcon sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />}
                    onClick={() => navigate('/chat')}
                    sx={{
                        backgroundColor: '#F76902',
                        padding: isMobile ? '12px 24px' : '16px 40px',
                        borderRadius: 3,
                        fontSize: isMobile ? '1rem' : '1.25rem',
                        fontWeight: '600',
                        textTransform: 'none',
                        transition: 'all 0.2s ease-in-out',
                        width: isMobile ? '100%' : 'auto',
                        minWidth: isMobile ? 'unset' : '300px',
                        '&:hover': {
                            backgroundColor: '#d55a02',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 15px rgba(247, 105, 2, 0.25)',
                        }
                    }}
                >
                    Start Chatting
                </Button>
            </Box>
        </Box>
    );
}

export default Home;
