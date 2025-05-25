import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, LogOut, Package, Users, TrendingUp, BarChart, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const location = useLocation()
    const pathname = location.pathname

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            to: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Stock",
            icon: Package,
            to: "/stock",
            active: pathname === "/stock",
        },
        {
            label: "Users",
            icon: Users,
            to: "/users",
            active: pathname === "/users",
        }, {
            label: "Reports",
            icon: BarChart,
            to: "/reports",
            active: pathname === "/reports",
        }, {
            label: "Orders",
            icon: ShoppingCart,
            to: "/commandes",
            active: pathname === "/commandes",
        },
        {
            label: "Suppliers",
            icon: Package,
            to: "/suppliers",
            active: pathname === "/suppliers",
        },
        {
            label: "Categories",
            icon: Package,
            to: "/categories",
            active: pathname === "/categories",
        },
    ]

    return (
        <div className="flex h-full w-64 flex-col bg-black text-white">
            <div className="flex h-14 items-center px-6">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-500" />

                    <span className="font-bold text-xl">STOCKIFY</span>
                </Link>
            </div>
            <div className="flex-1 space-y-1 px-3 py-4">
                {routes.map((route) => (
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
