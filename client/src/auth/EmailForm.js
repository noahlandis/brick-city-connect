import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';
import AuthForm from '../components/AuthForm';
import Modal from '../components/Modal';

function EmailForm() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [showActionButton, setShowActionButton] = useState(true);

    async function handleSendVerification() {
        setError('');
        try {
            const response = await sendRegisterMagicLink(username);
            if (response.status === 200) {
                setModalTitle('Check Your Inbox');
                setModalMessage(`Click the link we've sent to ${username}@rit.edu to finish creating your account.`);
                setShowActionButton(true);
                setShowModal(true);
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.error || 'Something went wrong';
            if (errorMessage === 'Account already exists') {
                setModalTitle('Account Already Exists');
                setModalMessage('It looks like you already have an account with us. Please Sign In.');
                setShowActionButton(false);
                setShowModal(true);
            } else {
                setError(errorMessage);
            }
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
                onClose={() => {
                    setUsername('');
                    setShowModal(false);
                }}
                title={modalTitle}
                message={modalMessage}
                actionText={showActionButton ? "try a different email" : null}
                onAction={showActionButton ? () => {
                    setUsername('');
                    setShowModal(false);
                } : null}
                showSignInButton={!showActionButton}
                signInLink={`/login?username=${username}`}
            />
        </>
    );
}

export default EmailForm;
