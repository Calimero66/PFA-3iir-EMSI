import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, LogOut, Package, Users, TrendingUp, BarChart, ShoppingCart, ListPlus, Warehouse } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const location = useLocation()
    const pathname = location.pathname
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    console.log("🚀 ~ Sidebar ~ user:", user)
    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            to: "/dashboard",
            active: pathname === "/dashboard",
            roles: ["Admin", "Manager", "Agent"],
        },
        {
            label: "Articles",
            icon: Package,
            to: "/articles",
            active: pathname === "/articles",
            roles: ["Admin", "Manager", "Agent"],

        },
        {
            label: "Stock",
            icon: Warehouse,
            to: "/stock",
            active: pathname === "/stock",
            roles: ["Admin", "Manager", "Agent"],

        },
        {
            label: "Users",
            icon: Users,
            to: "/users",
            active: pathname === "/users",
            roles: ["Admin", "Manager", "Agent"],

        }, {
            label: "Reports",
            icon: BarChart,
            to: "/reports",
            active: pathname === "/reports",
            roles: ["Admin", "Manager", "Agent"],

        }, {
            label: "Orders",
            icon: ShoppingCart,
            to: "/Orders",
            active: pathname === "/Orders",
            roles: ["Admin", "Manager", "Agent"],

        },
        {
            label: "Suppliers",
            icon: Users,
            to: "/suppliers",
            active: pathname === "/suppliers",
            roles: ["Admin", "Manager", "Agent"],

        },
        {
            label: "Categories",
            icon: ListPlus,
            to: "/categories",
            active: pathname === "/categories",
            roles: ["Admin", "Manager", "Agent"],

        },
    ]

    const Uroutes = routes.filter(route => route.roles.includes(user?.role));
    console.log("🚀 ~ Sidebar ~ Uroutes:", Uroutes)

    return (
        <div className="flex h-full w-64 flex-col bg-black text-white">
            <div className="flex h-14 items-center px-6">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-500" />

                    <span className="font-bold text-xl">STOCKIFY</span>
                </Link>
            </div>
            <div className="flex-1 space-y-1 px-3 py-4">
                {Uroutes.map((route) => (
                    <Link
                        key={route.to}
                        to={route.to}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            route.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                        )}
                    >
                        <route.icon className="h-5 w-5" />
                        {route.label}
                    </Link>
                ))}
            </div>
            <div className="p-4 border-t border-zinc-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    size="sm"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
