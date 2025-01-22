import { Typography, TextField, Button, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import GoogleOAuth from './GoogleOAuth';
import Footer from './Footer';

function GuestForm({ 
    title, 
    errorMessage,
    fields, 
    onSubmit, 
    submitButtonText, 
    footerText, 
    footerLinkText, 
    footerLinkTo,
    googleAuthText,
    isLoading   
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
                loading={isLoading}
                sx={{
                    width: '100%',
                    marginTop: { xs: '1.5rem', sm: '1.5rem' },
                    marginBottom: { xs: '2rem', sm: '1.5rem' },
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
                <div style={{ width: '100%', marginTop: { xs: '2rem', sm: '1.5rem' } }}>
                    <GoogleOAuth text={googleAuthText} />
                </div>
            )}

            <Typography variant="body2"
                sx={{
                    color: 'black',
                    textAlign: 'center',
                    marginTop: { xs: '2rem', sm: '1.3rem' },
                    fontSize: '0.875rem'
                }}
            >{footerText} <Link to={footerLinkTo} style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>{footerLinkText}</Link></Typography>

            <div style={{
                width: '100%',
                marginTop: '1rem'
            }}>
                <Footer />
            </div>
        </div>
    );
}

export default GuestForm;