import { Typography, TextField, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import GoogleOAuth from './GoogleOAuth';

function GuestForm({ 
    title, 
    errorMessage,
    fields, 
    onSubmit, 
    submitButtonText, 
    footerText, 
    footerLinkText, 
    footerLinkTo,
    googleAuthText 
}) {
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
            >{title}</Typography>

            {errorMessage && (
                <Typography 
                    color="error"
                    sx={{
                        textAlign: 'center',
                        marginTop: '1rem',
                        fontSize: '0.875rem'
                    }}
                >
                    {errorMessage}
                </Typography>
            )}

            {fields.map((field, index) => (
                <div key={index} style={{ width: '100%' }}>
                    <TextField
                        {...field}
                        variant="standard"
                        fullWidth
                        sx={{
                            marginTop: '2rem',
                        }}
                        size="small"
                    />
                    {field.additionalElement}
                </div>
            ))}

            <Button 
                variant="contained"
                onClick={onSubmit}
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
            >{submitButtonText}</Button>

            {googleAuthText && <GoogleOAuth text={googleAuthText} />}

            <Typography variant="body2"
                sx={{
                    color: 'black',
                    textAlign: 'center',
                    marginTop: '1rem',
                }}
            >{footerText} <Link to={footerLinkTo} style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>{footerLinkText}</Link></Typography>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '2rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                <Link to="/terms" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Terms & Conditions
                </Link>
                <Link to="/privacy" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Privacy Policy
                </Link>
                <Link to="/contact" style={{ color: '#666', fontSize: '0.75rem', textDecoration: 'none' }}>
                    Contact Us
                </Link>
            </div>

            <Typography 
                variant="caption" 
                sx={{
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontSize: '0.7rem'
                }}
            >
                © {new Date().getFullYear()} Brick City Connect. All rights reserved.
            </Typography>
        </div>
    );
}

export default GuestForm;