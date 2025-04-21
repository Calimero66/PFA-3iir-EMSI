import { createBrowserRouter } from "react-router-dom";
import Layout from "@/layout/layout";
import Login from "@/pages/login";
import Agents from "./pages/agents";
import Dashboard from "./pages/dashboard";
import Stock from "./pages/stock";
import Reports from "./pages/reports";
import Commandes from "./pages/commandes";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {

        path: "/",
        element: <Layout />,
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