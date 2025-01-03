import { Navigate } from 'react-router-dom';

function AuthGuard({ children }) {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/register" replace />;
    }
    return children;
}

export default AuthGuard;