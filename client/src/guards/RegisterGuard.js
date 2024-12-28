import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Outlet } from 'react-router-dom';

function RegisterGuard() {
    const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      console.log('No token found');
      navigate('/');
      return;
    }

    fetch(`http://localhost:3000/verify-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Invalid token');
          navigate('/');
          return;
        }
        setEmail(data.email);
        setIsVerified(true);
      })
      .catch(err => {
        console.error('Error verifying token:', err);
        navigate('/');
      });
  }, [searchParams, navigate]);

  if (!isVerified) {
    return <div>Loading...</div>;
  }

  return <Outlet context={{ email }} />;
}

export default RegisterGuard;