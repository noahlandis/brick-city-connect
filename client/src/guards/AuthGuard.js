import { Navigate, useLocation } from 'react-router-dom';

function AuthGuard({ children }) {
    const token = localStorage.getItem('token');
    const location = useLocation();
    
    if (!token) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return children;
}

export default AuthGuard;