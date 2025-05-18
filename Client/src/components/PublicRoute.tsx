import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const token = Cookies.get('token');
    
    if (token) {
        // Redirect to dashboard if already logged in
        return <Navigate to="/Dashboard" replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;