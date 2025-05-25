import { createBrowserRouter } from "react-router-dom";
import Layout from "@/layout/layoutAdmin";
import Login from "@/pages/admin/login";
import Users from "./pages/admin/users";
import Dashboard from "./pages/admin/dashboard";
import Stock from "./pages/admin/stock";
import Reports from "./pages/admin/reports";
import Commandes from "./pages/admin/commandes";
import ProtectedRoute from "./components/ProtectRoute/ProtectedRoute";
import PublicRoute from "./components/ProtectRoute/PublicRoute";
import Suppliers from "./pages/admin/suppliers";
import Categories from "./pages/admin/categories";

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
            { path: "/Users", element: <Users /> },
            { path: "/Stock", element: <Stock /> },
            { path: "/Reports", element: <Reports /> },
            { path: "/Commandes", element: <Commandes /> },
            { path: "/suppliers", element: <Suppliers /> },
            { path: "/categories", element: <Categories /> },


        ],
    },
]);

export default router;