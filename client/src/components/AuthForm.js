import { Typography, TextField, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function AuthForm({ 
    title, 
    errorMessage,
    fields, 
    onSubmit, 
    submitButtonText, 
    footerText, 
    footerLinkText, 
    footerLinkTo 
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
                <TextField
                    key={index}
                    {...field}
                    variant="standard"
                    fullWidth
                    sx={{
                        marginTop: '2rem',
                    }}
                    size="small"
                />
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

            <Typography variant="body2"
                sx={{
                    color: 'black',
                    textAlign: 'center',
                    marginTop: '1rem',
                }}
            >{footerText} <Link to={footerLinkTo} style={{ color: '#F76902', fontWeight: 'bold', textDecoration: 'underline' }}>{footerLinkText}</Link></Typography>
        </div>
    );
}

export default AuthForm;
