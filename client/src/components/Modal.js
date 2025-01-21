import { Modal as MuiModal, Box, Typography, Button } from '@mui/material';

function Modal({ open, onClose, title, message, actionText, onAction, showSignInButton, signInLink, useButton }) {
    return (
        <MuiModal
            open={open}
            onClose={onClose}
            aria-labelledby="success-modal"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                textAlign: 'center'
            }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    {message}
                </Typography>
                {actionText && !useButton && (
                    <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                        Not seeing the email? Check your spam folder or{' '}
                        <Box
                            component="span"
                            sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={onAction}
                        >
                            {actionText}
                        </Box>
                    </Typography>
                )}
                {actionText && useButton && (
                    <Button
                        variant="contained"
                        onClick={onAction}
                        sx={{
                            width: '100%',
                            marginTop: '1rem',
                            backgroundColor: 'black',
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            textTransform: 'none',
                        }}
                    >
                        {actionText}
                    </Button>
                )}
                {showSignInButton && (
                    <Button
                        variant="contained"
                        href={signInLink}
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
                    >
                        Sign In
                    </Button>
                )}
            </Box>
        </MuiModal>
    );
}

export default Modal;
