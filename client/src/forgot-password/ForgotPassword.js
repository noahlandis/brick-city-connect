import React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendForgotPasswordMagicLink } from '../api/magicLinkApi';
import GuestForm from '../components/GuestForm';
import { useModal } from '../contexts/ModalContext';
import validateFields from '../utils/validateFields';
function ForgotPassword() {
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
                { condition: !username, message: 'Username is required' },
                { condition: username.endsWith('@rit.edu'), message: `We didn't recognize ${username}@rit.edu as a valid RIT email address` },
            ],
        }, setErrors);

        if (!isValid) {
            return;
        }

        setErrors({ username: '' });
        try {
            const response = await sendForgotPasswordMagicLink(username);
            if (response.status === 200) {
                showModal({
                    title: 'Check Your Inbox',
                    message: `Click the link we've sent to ${username}@rit.edu to reset your password.`,
                    showActionButton: true,
                    actionText: 'try a different email',
                    onAction: () => {
                        setUsername('');
                        hideModal();
                    }
                });
            }
        } catch (err) {
            console.log("the error is", err);
            const errorMessage = err?.response?.data?.errors?.[0]?.msg || 'Something went wrong';
            setErrors({ username: errorMessage });
        }
    }

    const fields = [
        {
            label: "Username",
            placeholder: "Username",
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
        <GuestForm
            title="Forgot Password"
            errorMessage={invalidToken ? "The token provided is invalid or has expired. Please try again." : null}
            fields={fields}
            onSubmit={handleSendVerification}
            submitButtonText="Continue"
            footerText="Remember your password?"
            footerLinkText="Sign In"
            footerLinkTo="/login"
        />
    );
}

export default ForgotPassword;
