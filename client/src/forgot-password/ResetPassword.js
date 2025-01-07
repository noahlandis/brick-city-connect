import { useLoaderData, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { login } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    });

    async function handleResetPassword() {
        
       
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