import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { login } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

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

        >Sign In</Typography>
        <TextField
            label="username"
            placeholder="username"
            value={username}
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
            error={!!errors.username}
            helperText={errors.username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
            label="Password"
            placeholder="Password"
            type="password"
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
        />


        <Button 
            variant="contained"
            onClick={handleLogin}
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
        >Sign In</Button>
        <Typography variant="body2"
            sx={{
                color: 'black',
                textAlign: 'center',
                marginTop: '1rem',
            }}
        >Don't have an account? <Link to="/register" style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>Sign Up</Link></Typography>

    </div>

    );
}

export default Login;