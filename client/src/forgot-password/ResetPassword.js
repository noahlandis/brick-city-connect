import { useLoaderData, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { resetPassword } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useModal } from '../contexts/ModalContext';

function ResetPassword() {
    const { username } = useLoaderData();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    });
    const { showModal } = useModal();

    async function handleResetPassword() {
        try {
            console.log("passed username", username);
            const response = await resetPassword(username, password, confirmPassword);
            if (response.status === 200) {
                showModal({
                    title: 'Password Reset Successful',
                    message: 'Your password has been reset successfully. You can now sign in with your new password.',
                    showActionButton: false,
                    showSignInButton: true,
                    signInLink: `/login?username=${username}`
                });
            }
        } catch (error) {
            const serverErrors = error?.response?.data?.errors || [];
            const newErrors = { password: '', confirmPassword: '' };
            
            serverErrors.forEach(error => {
                // Map server errors to specific fields
                if (error.path === 'password') newErrors.password = error.msg;
                if (error.path === 'confirmPassword') newErrors.confirmPassword = error.msg;
                if (error.msg === 'Passwords do not match') newErrors.confirmPassword = error.msg;
            });
            setErrors(newErrors);
        }
    }
    
    const fields = [
        {
            label: "Password",
            placeholder: "Password",
            type: "password",
            value: password,
            error: !!errors.password,
            helperText: errors.password,
            onChange: (e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
            }
        },
        {
            label: "Confirm Password",
            placeholder: "Confirm Password",
            type: "password",
            value: confirmPassword,
            error: !!errors.confirmPassword,
            helperText: errors.confirmPassword,
            onChange: (e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
            }
        }
    ];

    return (
        <AuthForm
            title="Reset Password"
            fields={fields}
            onSubmit={handleResetPassword}
            submitButtonText="Reset Password"
            footerText="Remember your password?"
            footerLinkText="Sign In"
            footerLinkTo="/login"
        />
    );
}

export default ResetPassword;