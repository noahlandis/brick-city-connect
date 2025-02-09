import React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GuestForm from '../../components/GuestForm';
import { useModal } from '../../contexts/ModalContext';
import { sendRegisterMagicLink } from '../../api/magicLinkApi';
import validateFields from '../../utils/validateFields';
import { ERROR_CODES } from '../../utils/constants';
import ReactGA from 'react-ga4';

function EmailForm() {
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [errors, setErrors] = useState({
        username: ''
    });
    const { showModal, hideModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const invalidToken = searchParams.get('error') === ERROR_CODES.INVALID_TOKEN;

    async function handleSendVerification() {
        const isValid = validateFields({
            username: [
                { condition: !username, message: 'RIT Username is required' },
            ],
        }, setErrors);

        if (!isValid) {
            return;
        }

        setErrors({ username: '' });
        setIsLoading(true);
        
        try {
            const response = await sendRegisterMagicLink(username);
            if (response.status === 200) {
                ReactGA.event({
                    category: 'Auth',
                    action: 'email_verification_sent',
                    label: `username: ${username}, type: email`
                });
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
        } finally {
            setIsLoading(false);
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
        <GuestForm
            title="Sign Up"
                errorMessage={invalidToken ? "The token provided is invalid or has expired. Please try again." : null}
                fields={fields}
                onSubmit={handleSendVerification}
                submitButtonText="Continue"
            footerText="Already have an account?"
            footerLinkText="Sign In"
            footerLinkTo="/login"
            googleAuthText="signup_with"
            isLoading={isLoading}
        />
    );
}

export default EmailForm;
