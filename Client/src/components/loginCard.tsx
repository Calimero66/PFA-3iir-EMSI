import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-black border border-gray-800">
                <CardHeader className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                    <CardTitle className="text-xl text-white">Login to Stockify</CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your credentials to access your inventory dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleLogin()
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                            />
                        </div>
                        <CardFooter className="pt-4">
                            <Button
                                type="submit"
                                className="w-full bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                variant="outline"
                                disabled={loading}
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
