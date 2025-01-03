import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';
import AuthForm from '../components/AuthForm';
import { Modal, Box, Typography } from '@mui/material';

function EmailForm() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    async function handleSendVerification() {
        setError('');
        try {
            const response = await sendRegisterMagicLink(username);
            if (response.status === 200) {
                setShowModal(true);
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.error || 'Something went wrong';
            console.log("the error is", errorMessage);
            setError(errorMessage);
        }
    }

    const fields = [
        {
            label: "RIT Username",
            placeholder: "RIT Username",
            type: "text",
            value: username,
            error: !!error,
            helperText: error,
            onChange: (e) => {
                setUsername(e.target.value);
                setError('');
            },
            InputProps: {
                endAdornment: <span style={{ color: 'rgba(0, 0, 0, 0.54)' }}>@rit.edu</span>
            }
        }
    ];

    return (
        <>
            <AuthForm
                title="Sign Up"
                fields={fields}
                onSubmit={handleSendVerification}
                submitButtonText="Continue"
                footerText="Already have an account?"
                footerLinkText="Sign In"
                footerLinkTo="/login"
            />
            
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="success-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    textAlign: 'center'
                }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        Check Your Inbox
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        Click the link we've sent to {username}@rit.edu to finish creating your account.
                    </Typography>
                    <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                        Not seeing the email? Check your spam folder or{' '}
                        <Box
                            component="span"
                            sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                                setUsername('');
                                setShowModal(false);
                            }}
                        >
                            try a different email
                        </Box>
                    </Typography>
                </Box>
            </Modal>
        </>
    );
}

export default EmailForm;
