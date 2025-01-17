import React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useModal } from '../contexts/ModalContext';
import { sendRegisterMagicLink } from '../api/magicLinkApi';
import validateFields from '../utils/validateFields';

function EmailForm() {
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [errors, setErrors] = useState({
        username: ''
    });
    const { showModal, hideModal } = useModal();

    const invalidToken = searchParams.get('error') === 'INVALID_TOKEN';

    async function handleSendVerification() {
        const isValid = validateFields({
            username: [
                { condition: !username, message: 'RIT Username is required' },
                { condition: username.endsWith('@rit.edu'), message: `We didn't recognize ${username}@rit.edu as a valid RIT email address` },
            ],
        }, setErrors);

        if (!isValid) {
            return;
        }

        setErrors({ username: '' });
        
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
                        hideModal();
                    }
                });
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.errors?.[0]?.msg || 'Something went wrong';
            if (errorMessage === 'Account already exists') {
                showModal({
                    title: 'Account Already Exists',
                    message: 'It looks like you already have an account with us. Please Sign In.',
                    showActionButton: false,
                    showSignInButton: true,
                    signInLink: `/login?username=${username}`
                });
            } else {
                setErrors({ username: errorMessage });
            }
        }
    }

    const fields = [
        {
            label: "RIT Username",
            placeholder: "RIT Username",
            type: "text",
            value: username,
            error: !!errors.username,
            helperText: errors.username,
            onChange: (e) => {
                setUsername(e.target.value);
                setErrors({ username: '' });
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
            googleAuthText="signup_with"
        />
    );
}

export default EmailForm;
