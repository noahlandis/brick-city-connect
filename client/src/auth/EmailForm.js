import React from 'react';
import { useState } from 'react';
import { sendRegisterMagicLink } from '../api/registerMagicLinkApi';
import { Typography, TextField, Button, Modal } from '@mui/material';
import { Link } from 'react-router-dom';

function EmailForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    async function handleSendVerification() {
        setError('');
        try {
            const response = await sendRegisterMagicLink(email);
            if (response.status === 200) {
                console.log("the response is", response);
                setEmail('');
            }
        } catch (err) {
            const errorMessage = err?.response?.data?.error || 'Something went wrong';
            console.log("the error is", errorMessage);
            setError(errorMessage);
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
                label="RIT Email"
                placeholder="username@rit.edu"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                }}
                fullWidth
                sx={{
                    marginTop: '2rem',

                }}
                size="small"
                error={!!error}
                helperText={error}
            />

            <Button variant="contained"
                sx={{
                    width: '100%',
                    marginTop: '1rem',
                    backgroundColor: 'black',
                    color: 'white',
                    fontFamily: '"Helvetica Neue"',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    textTransform: 'none',
                    marginTop: '2rem',
                }}
                onClick={handleSendVerification}
            >Continue</Button>
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

export default EmailForm;
