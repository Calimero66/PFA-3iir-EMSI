import { Sidebar } from "@/components/sideBarAdmin/sidebar"
import { Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <div className="flex h-screen bg-zinc-950">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
