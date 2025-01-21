import { Typography, TextField, Button, Divider } from '@mui/material';
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
            margin: '0 auto',
            position: 'relative',
            minHeight: {
                xs: 'calc(100vh - 200px)',
                sm: 'auto'
            }
        }}>
            <Typography variant="h5"
                sx={{
                    color: "black",
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: {
                        xs: '1.5rem',
                        sm: '1.4rem'
                    },
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
                    marginTop: '1.5rem',
                    backgroundColor: 'black',
                    color: 'white',
                    fontFamily: '"Helvetica Neue"',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    textTransform: 'none',
                    padding: '0.5rem 0',
                }}
            >{submitButtonText}</Button>

            {googleAuthText && (
                <div style={{ width: '100%', marginTop: '1.5rem' }}>
                    <GoogleOAuth text={googleAuthText} />
                </div>
            )}

            <Typography variant="body2"
                sx={{
                    color: 'black',
                    textAlign: 'center',
                    marginTop: '1rem',
                    fontSize: '0.875rem'
                }}
            >{footerText} <Link to={footerLinkTo} style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>{footerLinkText}</Link></Typography>

            <div style={{
                width: '100%',
                marginTop: '1rem'
            }}>
                <Divider sx={{ marginY: 2 }} />
                
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginBottom: '0.5rem',
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
                        display: 'block',
                        fontSize: '0.7rem'
                    }}
                >
                    © {new Date().getFullYear()} Brick City Connect. All rights reserved.
                </Typography>
            </div>
        </div>
    );
}

export default GuestForm;