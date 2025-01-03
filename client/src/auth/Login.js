import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { login } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

function Login() {
    const [errors, setErrors] = useState({
        username: '',
        password: '',

    });
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';  // Default to home if no intended destination

    async function handleLogin() {
        setErrors({
            username: '',
            password: '',
        });
        
        try {
            const response = await login(username, password);
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                // Navigate to the intended destination
                navigate(from);
            }
        } catch (err) {
            console.log(err);
            const serverErrors = err?.response?.data?.errors || [];
            const newErrors = { username: '', password: '' };
            
            serverErrors.forEach(error => {
                // Map server errors to specific fields
                if (error.path === 'username') newErrors.username = error.msg;
                if (error.path === 'password') newErrors.password = error.msg;
            });
            
            setErrors(newErrors);
        }
    }
    
    const fields = [
        {
            label: "Username",
            placeholder: "Username",
            value: username,
            error: !!errors.username,
            helperText: errors.username,
            onChange: (e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: '' });
            }
        },
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
        }
    ];

    return (
        <AuthForm
            title="Sign In"
            fields={fields}
            onSubmit={handleLogin}
            submitButtonText="Sign In"
            footerText="Don't have an account?"
            footerLinkText="Sign Up"
            footerLinkTo="/register"
        />
    );
}

export default Login;