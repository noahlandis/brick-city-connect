import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ERROR_CODES } from './utils/constants';
import { useModal } from './contexts/ModalContext';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
function Home() {
    const navigate = useNavigate();
    const { clientLogout } = useAuth();
    const [searchParams] = useSearchParams();
    const { showModal, hideModal } = useModal();
    const isMediaPermissionDenied = searchParams.get('error') === ERROR_CODES.MEDIA_PERMISSION_DENIED;

    useEffect(() => {
        if (isMediaPermissionDenied) {
            showModal({
                title: "Camera and Microphone Access Required",
                message: "To use the chat feature, please allow access to your camera and microphone. Make sure your device is not muted. You can update these permissions in your browser settings.",
                showCloseButton: true,
                closeButtonText: "OK",
                onClose: hideModal
            });
        }
    }, [isMediaPermissionDenied, showModal, hideModal]);

    async function logout() {
        clientLogout();
        navigate('/login');
    }

    return (
        <div>
            <Button 
                variant="contained"
                startIcon={<VideocamIcon />}
                onClick={() => navigate('/chat')}
                sx={{
                    backgroundColor: '#F76902',
                    '&:hover': {
                        backgroundColor: '#d55a02',
                    },
                    padding: '12px'
                }}
            >
                Start Chatting
            </Button>
            <Button 
                variant="outlined"
                onClick={logout}
                sx={{
                    color: 'black',
                    borderColor: 'black',
                    '&:hover': {
                        borderColor: '#333',
                        backgroundColor: '#f5f5f5'
                    }
                }}
            >
                Logout
            </Button>
        </div>
    );
}

export default Home;