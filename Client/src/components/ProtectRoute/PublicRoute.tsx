import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const token = Cookies.get('token');

    if (token) {
        // If user has a token, redirect them to dashboard regardless of role
        // This prevents authenticated users from accessing login page
        return <Navigate to="/Dashboard" replace />;
    }

    // If no token, allow access to public routes (login page)
    return <>{children}</>;
};

export default PublicRoute;