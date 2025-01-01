import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Register() {
    const { email } = useLoaderData();
    const [error, setError] = useState('');
    
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
            label="RIT Email"
            placeholder="username@rit.edu"
            value={email}
            disabled
            fullWidth
            sx={{
                marginTop: '2rem',

            }}
            size="small"
            error={!!error}
            helperText={error}
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
        />

        <TextField
            label="Confirm Password"
            placeholder="Confirm Password"
            type="password"
            fullWidth
            sx={{
                marginTop: '2rem',
            }}
            size="small"
        />

        <Button variant="contained"
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