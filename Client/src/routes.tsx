import { createBrowserRouter } from "react-router-dom";
import Layout from "@/layout/layoutAdmin";
import Login from "@/pages/admin/login";
import Users from "./pages/admin/users";
import Dashboard from "./pages/admin/dashboard";
import Articles from "./pages/admin/Articles";
import Reports from "./pages/admin/reports";
import Orders from "./pages/admin/orders";
import Stock from "./pages/admin/stock";
import StockMovements from "./pages/admin/StockMouvment";
import ProtectedRoute from "./components/ProtectRoute/ProtectedRoute";
import PublicRoute from "./components/ProtectRoute/PublicRoute";
import Suppliers from "./pages/admin/suppliers";
import Categories from "./pages/admin/categories";
import { QRCodeTest } from "./components/qr-code-test";
import ArticleDownload from "./pages/download/ArticleDownload";
import OrderDownload from "./pages/download/OrderDownload";

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
            { path: "/Articles", element: <Articles /> },
            { path: "/Stock", element: <Stock /> },
            { path: "/StockMovements", element: <StockMovements /> },
            { path: "/Reports", element: <Reports /> },
            { path: "/Orders", element: <Orders /> },
            { path: "/suppliers", element: <Suppliers /> },
            { path: "/categories", element: <Categories /> },
            { path: "/qr-test", element: <QRCodeTest /> },
            { path: "/download/article/:id/:format", element: <ArticleDownload /> },
            { path: "/download/article/:id", element: <ArticleDownload /> },
            { path: "/download/order/:id/:format", element: <OrderDownload /> },
            { path: "/download/order/:id", element: <OrderDownload /> },

        ],
    },
]);

export default router;