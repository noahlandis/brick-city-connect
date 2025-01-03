import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { register } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
function Register() {
    const { username } = useLoaderData();
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    async function handleRegister() {
        setErrors({
            username: '',
            password: '',
            confirmPassword: ''
        });
        
        try {
            const response = await register(username, password, confirmPassword);
            if (response.status === 201) {
                localStorage.setItem('token', response.data.token);
                navigate('/');
            }
        } catch (err) {
            const serverErrors = err?.response?.data?.errors || [];
            const newErrors = { username: '', password: '', confirmPassword: '' };
            
            serverErrors.forEach(error => {
                // Map server errors to specific fields
                if (error.path === 'username') newErrors.username = error.msg;
                if (error.path === 'password') newErrors.password = error.msg;
                if (error.path === 'confirmPassword') newErrors.confirmPassword = error.msg;
                if (error.msg === 'Passwords do not match') newErrors.confirmPassword = error.msg;
            });
            
            setErrors(newErrors);
        }
    }
    
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto'
        }}>
        <Typography variant="h5"
            sx={{
                color: "black",
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '1.4rem',
                marginTop: '0.5rem',
                fontFamily: '"Helvetica Neue"',
            }}

        >Sign Up</Typography>
        <TextField
            label="Username"
            placeholder="Username"
            variant="standard"
            value={username}
            disabled
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
            error={!!errors.username}
            helperText={errors.username}
        />
        <TextField
            label="Password"
            placeholder="Password"
            type="password"
            variant="standard"
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
            onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
            }}
            error={!!errors.password}
            helperText={errors.password}
        />

        <TextField
            label="Confirm Password"
            placeholder="Confirm Password"
            type="password"
            variant="standard"
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
            onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
            }}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
        />

        <Button 
            variant="contained"
            onClick={handleRegister}
            sx={{
                width: '100%',
                marginTop: '2rem',
                backgroundColor: 'black',
                color: 'white',
                fontFamily: '"Helvetica Neue"',
                fontWeight: 'bold',
                borderRadius: '8px',
                textTransform: 'none',
            }}
        >Create Account</Button>
        <Typography variant="body2"
            sx={{
                color: 'black',
                textAlign: 'center',
                marginTop: '1rem',
            }}
        >Already have an account? <Link to="/login" style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>Sign In</Link></Typography>

    </div>

    );
}

export default Register;