import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { login } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import GuestForm from '../../components/GuestForm';
import validateFields from '../../utils/validateFields';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
    const { clientLogin } = useAuth();
    const [searchParams] = useSearchParams();
    const [errors, setErrors] = useState({
        username: '',
        password: '',
    });
    const [username, setUsername] = useState(searchParams.get('username') || '');

    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';  // Default to home if no intended destination
    const [isLoading, setIsLoading] = useState(false);
    async function handleLogin() {
        const isValid = validateFields({
            username: [
                { condition: !username, message: 'Username is required' },
            ],
            password: [
                { condition: !password, message: 'Password is required' },
            ],
        }, setErrors);

        if (!isValid) {
            return;
        }

        setErrors({
            username: '',
            password: '',
        });
        setIsLoading(true);
        try {
            const response = await login(username, password);
            if (response.status === 200) {
                clientLogin(response.data);
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
        } finally {
            setIsLoading(false);
        }
    }
    
    const fields = [
        {
            label: "Username",
            placeholder: "Username",
            value: username,
            error: !!errors.username,
            helperText: errors.username,
            onChange: (e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: '' });
            }
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
                setErrors({ ...errors, password: '' });
            },
            additionalElement: (
                <Link 
                    to="/forgot-password" 
                    style={{ 
                        alignSelf: 'flex-end',
                        textDecoration: 'none',
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#F76902',
                        fontWeight: 'bold',
                        fontStyle: 'italic'
                    }}
                >
                    Forgot Password?
                </Link>
            )
        }
    ];

    return (
        <GuestForm
            title="Sign In"
            fields={fields}
            onSubmit={handleLogin}  
            submitButtonText="Sign In"
            footerText="Don't have an account?"
            footerLinkText="Sign Up"
            footerLinkTo="/register"
            googleAuthText="signin_with"
            isLoading={isLoading}
        />
    );
}

export default Login;