import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';


const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const token = Cookies.get('token');
    console.log("🚀 ~ PublicRoute ~ token:", token)
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    console.log("🚀 ~ PublicRoute ~ user:", user.role)
    if (token) {
        // Redirect to dashboard if already logged in
        if (user.role === "admin") {
            
            return <Navigate to="/Dashboard" replace />;

        }else if (user.role === "Manager") {

            return <Navigate to="/Dashboard" replace />;

        }else if (user.role === "Agent") {

            return <Navigate to="/Dashboard" replace />;

        }
    }
    


    return <>{children}</>;
};

export default PublicRoute;