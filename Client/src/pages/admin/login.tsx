import { useState } from "react"
import Cookies from 'js-cookie'

import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginCard } from "@/components/loginCard"
import dashboardImage from "@/images/1744766807540.jpg"

import api from "@/lib/api"
import { toast, Toaster } from "sonner"
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
    const navigate = useNavigate()
    const [showLogin, setShowLogin] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        try {
            const response = await api.post("/login", { 
                email,
                password 
            })
            
            // Store the token in cookies instead of localStorage
            const { access_token } = response.data
            Cookies.set('token', access_token, { 
                expires: 7, // expires in 7 days
                secure: true, // only transmitted over HTTPS
                sameSite: 'strict' // protection against CSRF
            })
            
            // Update auth header for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
            
            toast.success("Login successful", {
                duration: 1000,
            })
            
            setTimeout(() => {
                navigate("/dashboard")
            }, 1000)
        } catch (err) {
            toast.error("Invalid email or password")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Toaster richColors position="bottom-right" />

            {/* Header */}
            <header className="container mx-auto flex items-center justify-between py-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                    <span className="text-xl font-bold tracking-tight">STOCKIFY</span>
                </div>
                <Button
                    variant="outline"
                    className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => setShowLogin(true)}
                >
                    Login
                </Button>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto py-20 text-center">
                <h1 className="text-6xl font-bold tracking-tight mb-6">Manage inventory at the speed of thought</h1>
                <p className="text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
                    Most inventory systems are designed for enterprises. Stockify is designed for small businesses who want a
                    simple way to manage their inventory.
                </p>

                {/* Image */}
                <div className="relative w-full max-w-5xl mx-auto">
                    <div className="bg-gradient-to-b from-purple-500/20 to-transparent absolute -top-10 left-1/2 -translate-x-1/2 w-full h-40 blur-3xl rounded-full" />
                    <img
                        src={dashboardImage}
                        width={1200}
                        height={800}
                        alt="Stock management dashboard preview"
                        className="w-full h-auto rounded-lg border border-gray-800 shadow-2xl"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-4">
                <div className="container mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            <span className="text-lg font-bold tracking-tight">STOCKIFY</span>
                        </div>
                        <div className="text-gray-500 text-sm">© 2025 Stockify. All rights reserved.</div>
                    </div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLogin && (
                <LoginCard
                    onClose={() => setShowLogin(false)}
                    email={email} 
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    handleLogin={handleLogin}
                    loading={loading}
                />

            )}
        </div>
    )
}
export default LoginPage
