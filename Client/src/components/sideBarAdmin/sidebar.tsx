import { Link, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, LogOut, Package, Users, TrendingUp, BarChart, ShoppingCart, ListPlus, Warehouse } from "lucide-react"
import Cookies from "js-cookie"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"

export function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const pathname = location.pathname
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const userName = user?.name || "Unknown User"
    const userRole = user?.role || "Unknown"

    console.log("🚀 ~ Sidebar ~ user:", user)

    // Get role color based on role type
    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'bg-red-500/20 text-red-400 border border-red-500/30'
            case 'manager':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            case 'agent':
                return 'bg-green-500/20 text-green-400 border border-green-500/30'
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }
    }

    // Logout function
    const handleLogout = async () => {
        try {
            await api.post("/logout")

            // Clear localStorage
            localStorage.removeItem("user")
            // localStorage.removeItem("token")
            Cookies.remove('token')

            // Redirect to login page
            navigate("/")

            console.log("✅ Logout successful")
        } catch (error) {
            console.error("❌ Logout error:", error)

            // Even if API call fails, clear local storage and redirect
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            navigate("/login")
        }
    }
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
            roles: ["Admin", "Manager"],

        }, {
            label: "Stock Movements",
            icon: BarChart,
            to: "/stockmovements",
            active: pathname === "/stockmovements",
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
            <div className="p-4 border-t border-zinc-800 space-y-3">
                {/* User Role Display */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{userName}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(userRole)}`}>
                                {userRole}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    size="sm"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
