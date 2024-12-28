import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            console.log('No token found');
            navigate('/');
            return;
        }

        // Verify token with backend
        fetch(`http://localhost:3000/verify-token?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error('Invalid token');
                    navigate('/');
                    return;
                }
                setEmail(data.email);
            })
            .catch(err => {
                console.error('Error verifying token:', err);
                navigate('/');
            });
    }, [searchParams, navigate]);

    if (!email) {
        return <div>Loading...</div>;
    }

    return <div>
        <h1>Register</h1>
        <p>Registering with email: {email}</p>
    </div>
}

export default Register;