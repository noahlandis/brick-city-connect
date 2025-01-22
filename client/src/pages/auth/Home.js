import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ERROR_CODES } from '../../utils/constants';
import { useModal } from '../../contexts/ModalContext';
import { useSearchParams } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showModal, hideModal } = useModal();


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
    }, [searchParams.get('error')]);

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
    }, [searchParams.get('chat-disabled')]);

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