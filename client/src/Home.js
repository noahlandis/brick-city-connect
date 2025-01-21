import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ERROR_CODES } from './utils/constants';
import { useModal } from './contexts/ModalContext';
import { useSearchParams } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showModal, hideModal } = useModal();


    useEffect(() => {
        // Clear the error parameter from URL if it exists
        if (searchParams.has('error')) {
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, []); // Run once when component mounts

    useEffect(() => {
        if (searchParams.get('error') === ERROR_CODES.MEDIA_PERMISSION_DENIED) {
            showModal({
                title: "Camera and Microphone Access Required",
                message: "To use the chat feature, please allow access to your camera and microphone. Make sure your device is not muted. You can update these permissions in your browser settings.",
                actionText: "OK",
                useButton: true,
                onAction: () => {
                    if (searchParams.has('error')) {
                        searchParams.delete('error');
                        setSearchParams(searchParams);
                    }
                    hideModal();
                }
            });
        }
    }, [showModal, hideModal, searchParams]);

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
        </div>
    );
}

export default Home;