import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { register } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import GuestForm from '../../components/GuestForm';
import { useModal } from '../../contexts/ModalContext';
import validateFields from '../../utils/validateFields';
import { useAuth } from '../../contexts/AuthContext';
import ReactGA from 'react-ga4';

function Register() {
    const { showModal } = useModal();
    const { username } = useLoaderData();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();
    const { clientLogin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    async function handleRegister() {
        const isValid = validateFields({
            username: [
                { condition: !username, message: 'Username is required' },
            ],
            password: [
                { condition: !password, message: 'Password is required' },
                { condition: password.length < 6, message: 'Password must be at least 6 characters long' },
            ],
            confirmPassword: [
                { condition: !confirmPassword, message: 'Confirm Password is required' },
                { condition: password !== confirmPassword, message: 'Passwords do not match' },
            ],
        }, setErrors);

        if (!isValid) {
            return;
        }

        setErrors({
            username: '',
            password: '',
            confirmPassword: ''
        });
        setIsLoading(true);
        try {
            const response = await register(username, password, confirmPassword);
            if (response.status === 201) {
                clientLogin(response.data);
                navigate('/');
                ReactGA.event({
                    category: 'Auth',
                    action: 'user_registered',
                    label: `username: ${username}, type: email`
                });
            }
        } catch (err) {
            if (err?.response?.data?.errors?.[0]?.msg === 'Account already exists') {
                showModal({
                    title: 'Account Already Exists',
                    message: 'It looks like you already have an account with us. Please Sign In.',
                    showActionButton: false,
                    showSignInButton: true,
                    signInLink: `/login?username=${username}`
                });
            } else {
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
        } finally {
            setIsLoading(false);
        }
    }

    const fields = [
        {
            label: "Username",
            placeholder: "Username",
            value: username,
            disabled: true,
            error: !!errors.username,
            helperText: errors.username
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
                setErrors(prev => ({ ...prev, password: '' }));
            }
        },
        {
            label: "Confirm Password",
            placeholder: "Confirm Password",
            type: "password",
            value: confirmPassword,
            error: !!errors.confirmPassword,
            helperText: errors.confirmPassword,
            onChange: (e) => {
                setConfirmPassword(e.target.value);
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        }
    ];

    return (
        <GuestForm
            title="Sign Up"
            fields={fields}
            onSubmit={handleRegister}
            submitButtonText="Create Account"
            footerText="Already have an account?"
            footerLinkText="Sign In"
            footerLinkTo="/login"
            googleAuthText="signup_with"
            isLoading={isLoading}
            discordAuthText="Sign up with Discord"
        />

    );
}

export default Register;