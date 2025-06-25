import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginCardProps {
    onClose: () => void
    email: string
    password: string
    setEmail: (value: string) => void
    setPassword: (value: string) => void
    handleLogin: () => void
    loading: boolean
}

export const LoginCard = ({
    onClose,
    email,
    password,
    setEmail,
    setPassword,
    handleLogin,
    loading,
}: LoginCardProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Background glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 rounded-lg"></div>

                <CardHeader className="relative pb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>

                    <div className="space-y-2 pt-2">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-gray-300 text-base">
                            Sign in to access your Stockify dashboard
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="relative">
                    <form
                        className="space-y-8"
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleLogin()
                        }}
                    >
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-white font-medium text-sm">
                                Email Address
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 h-12 rounded-lg group-hover:border-white/30"
                                    required
                                />
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="password" className="text-white font-medium text-sm">
                                Password
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 h-12 rounded-lg group-hover:border-white/30"
                                    required
                                />
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                            </div>
                        </div>

                        <CardFooter className="pt-6 px-0 pb-0">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 font-semibold py-3 h-12 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 relative overflow-hidden group"
                                disabled={loading}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <span className="relative">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Signing In...
                                        </div>
                                    ) : (
                                        "Sign In"
                                    )}
                                </span>
                            </Button>
                        </CardFooter>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-900 px-4 text-gray-400">Welcome back, agent</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}