import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';
import AuthForm from '../components/AuthForm';

function EmailForm() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    async function handleSendVerification() {
        setError('');
        try {
            const response = await sendRegisterMagicLink(username);
            if (response.status === 200) {
                console.log("the response is", response);
                setUsername('');
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
        <AuthForm
            title="Sign Up"
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
