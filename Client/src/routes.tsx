import { createBrowserRouter } from "react-router-dom";
import Layout from "@/layout/layoutAdmin";
import Login from "@/pages/admin/login";
import Agents from "./pages/admin/agents";
import Dashboard from "./pages/admin/dashboard";
import Stock from "./pages/admin/stock";
import Reports from "./pages/admin/reports";
import Commandes from "./pages/admin/commandes";
import ProtectedRoute from "./components/ProtectRoute/ProtectedRoute";
import PublicRoute from "./components/ProtectRoute/PublicRoute";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PublicRoute>
                <Login />
            </PublicRoute>
        ),
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            { path: "/Dashboard", element: <Dashboard />, index: true },
            { path: "/Agents", element: <Agents /> },
            { path: "/Stock", element: <Stock /> },
            { path: "/Reports", element: <Reports /> },
            { path: "/Commandes", element: <Commandes /> },
        ],
    },
]);

export default router;