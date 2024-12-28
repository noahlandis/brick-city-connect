import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Outlet } from 'react-router-dom';
import { verifyToken } from '../api/registerMagicLinkApi';

function RegisterGuard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);
    const [email, setEmail] = useState(null);

    useEffect(() => {
        const verifyUserToken = async () => {
            const token = searchParams.get('token');
            if (!token) {
                navigate('/');
                return;
            }
            const response = await verifyToken(token);
            if (response.error) {
                navigate('/');
                return;
            }
            setEmail(response.email);
            setIsVerified(true);
        };

        verifyUserToken();
    }, [searchParams, navigate]);

  return <Outlet context={{ email }} />;
}

export default RegisterGuard;