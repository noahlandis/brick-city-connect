import React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';
import AuthForm from '../components/AuthForm';
import { useModal } from '../contexts/ModalContext';

function EmailForm() {
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const { showModal } = useModal();

    const invalidToken = searchParams.get('error') === 'INVALID_TOKEN';

    async function handleSendVerification() {
        setError('');
        try {
            const response = await sendRegisterMagicLink(username);
            if (response.status === 200) {
                showModal({
                    title: 'Check Your Inbox',
                    message: `Click the link we've sent to ${username}@rit.edu to finish creating your account.`,
                    showActionButton: true,
                    actionText: 'try a different email',
                    onAction: () => {
                        setUsername('');
                    }
                });
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.error || 'Something went wrong';
            if (errorMessage === 'Account already exists') {
                showModal({
                    title: 'Account Already Exists',
                    message: 'It looks like you already have an account with us. Please Sign In.',
                    showActionButton: false,
                    showSignInButton: true,
                    signInLink: `/login?username=${username}`
                });
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
        <AuthForm
            title="Sign Up"
            errorMessage={invalidToken ? "The token provided is invalid or has expired. Please try again." : null}
            fields={fields}
            onSubmit={handleSendVerification}
            submitButtonText="Continue"
            footerText="Already have an account?"
            footerLinkText="Sign In"
            footerLinkTo="/login"
        />
    );
}

export default EmailForm;
