import { useState,useRef } from "react"
import Cookies from "js-cookie"

import { TrendingUp, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginCard } from "@/components/loginCard"

import api from "@/lib/api"
import { toast, Toaster } from "sonner"
import { useNavigate } from "react-router-dom"
import img from "@/images/Screenshot_1.png"

const LoginPage = () => {
    const navigate = useNavigate()
    const [showLogin, setShowLogin] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const DemoRef = useRef<HTMLDivElement>(null)

    const handleLogin = async () => {
        setLoading(true)
        try {
            const response = await api.post("/login", {
                email,
                password,
            })

            // Store the token in cookies
            const { access_token } = response.data
            Cookies.set("token", access_token, {
                expires: 7,
                secure: true, // only transmitted over HTTPS
                sameSite: "strict", // protection against CSRF
            })

            // Update auth header for future requests
            api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

            toast.success("Login successful", {
                duration: 1000,
            })

            const user = response.data.user
            localStorage.setItem("user", JSON.stringify(user))

            setTimeout(() => {
                navigate("/dashboard")
            }, 500)
        } catch (err) {
            toast.error("Invalid email or password")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // const scrollToDemo = () => {
    //     const demoSection = document.getElementById("demo-section")
    //     if (demoSection) {
    //         demoSection.scrollIntoView({
    //             behavior: "smooth",
    //             block: "start",
    //         })
    //     }
    // }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

            <Toaster richColors position="bottom-right" />

            {/* Header */}
            <header className="relative z-10 container mx-auto flex items-center justify-between py-8 px-6">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative">
                        <TrendingUp className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-lg group-hover:bg-purple-300/30 transition-all duration-300"></div>
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                        STOCKIFY
                    </span>
                </div>
                <Button
                    variant="outline"
                    className="bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 px-6 py-2 rounded-full group"
                    onClick={() => setShowLogin(true)}
                >
                    <span>Login</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto py-20 text-center px-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-200">Inventory Management Reimagined</span>
                </div>

                {/* Main heading */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
                        Manage inventory
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                        at the speed of thought
                    </span>
                </h1>

                <p className="text-gray-300 max-w-3xl mx-auto mb-12 text-xl leading-relaxed">
                    Most inventory systems are designed for enterprises.
                    <span className="text-purple-200 font-medium"> Stockify is designed for small businesses</span> who want a
                    simple way to manage their inventory with style and efficiency.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 group"
                        onClick={() => setShowLogin(true)}
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-purple-400/50 px-8 py-4 rounded-full text-lg transition-all duration-300"
                        onClick={()=> {DemoRef.current?.scrollIntoView({behavior: 'smooth'})}}
                    >
                        Watch Demo
                    </Button>
                </div>

                {/* Dashboard Preview */}
                <div id="demo-section" ref={DemoRef} className="relative w-full max-w-6xl mx-auto p-16">
                    {/* Glow effects */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 blur-3xl rounded-full"></div>
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-2xl rounded-full"></div>

                    {/* Image container */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <img
                            src={img}
                            width={1200}
                            height={800}
                            alt="Stock management dashboard preview"
                            className="relative w-full h-auto rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm group-hover:scale-[1.02] transition-transform duration-500"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                </div>

                {/* Demo Section */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            See Stockify in Action
                        </h2>
                        <p className="text-gray-300 text-lg">
                            Watch how easy it is to manage your inventory with our intuitive interface
                        </p>
                    </div>

                    {/* Video placeholder or interactive demo */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Interactive Demo</h3>
                            <p className="text-gray-300 mb-6">Experience the full power of Stockify with our interactive demo</p>
                            <Button
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 px-6 py-2 rounded-full transition-all duration-300"
                                onClick={() => setShowLogin(true)}
                            >
                                Start Demo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats or features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                            10x
                        </div>
                        <div className="text-gray-300">Faster Setup</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                            99.9%
                        </div>
                        <div className="text-gray-300">Uptime</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-3xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                            24/7
                        </div>
                        <div className="text-gray-300">Support</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8 mt-20 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-purple-400" />
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                STOCKIFY
                            </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                            © 2025 Stockify. All rights reserved. Made with ❤️ for small businesses.
                        </div>
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