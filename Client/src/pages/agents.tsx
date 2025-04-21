import { useState } from "react"
import { AlertCircle, MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"



// Sample data
// const agents = [
//     {
//         id: 1,
//         name: "John Doe",
//         email: "john.doe@stockify.com",
//         role: "Admin",
//         lastActive: "Today, 10:30 AM",
//         status: "Active",
//     },
//     {
//         id: 2,
//         name: "Jane Smith",
//         email: "jane.smith@stockify.com",
//         role: "Manager",
//         lastActive: "Yesterday, 3:45 PM",
//         status: "Active",
//     },
//     {
//         id: 3,
//         name: "Mike Johnson",
//         email: "mike.johnson@stockify.com",
//         role: "Agent",
//         lastActive: "Apr 15, 2023",
//         status: "Inactive",
//     },
// ]
type Agent = {
    id: number
    name: string
    email: string
    role: string
    lastActive: string
    status: string
}

export default function AgentsPage() {
    const [open, setOpen] = useState(false)
    const [agentsData, setAgentsData] = useState<Agent[]>([])

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState("")

    const [showAlert, setShowAlert] = useState(false)

    const handleAddAgent = () => {
        if (password !== confirmPassword) {
            setShowAlert(true)
            return
        }

        const newAgent = {
            id: agentsData.length + 1,
            name,
            email,
            role,
            lastActive: "Just now",
            status: "Active",
        }
        console.log(newAgent)
        setAgentsData([...agentsData, newAgent])
        setOpen(false)
        setShowAlert(false)
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setRole("")
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Agent Management</h1>
                    <p className="text-zinc-400">Manage your team members</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 transition-colors">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">Add New Agent</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {showAlert && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Passwords Error</AlertTitle>
                                    <AlertDescription>Passwords do not match</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-zinc-400">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter full name"
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-zinc-400">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-zinc-400">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword" className="text-zinc-400">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="role" className="text-zinc-400 pb-2">
                                    Role
                                </Label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                                >
                                    <option value="" disabled>Select a role</option>
                                    <option value="admin" className="text-white">Admin</option>
                                    <option value="manager" className="text-white">Manager</option>
                                    <option value="agent" className="text-white">Agent</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-zinc-700 bg-zinc-800 text-white hover:text-zinc-800 hover:bg-white"
                            >
                                Cancel
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 transition-colors" onClick={() => handleAddAgent()}>
                                Add Agent
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 h-full">
                <CardHeader>
                    <CardTitle className="text-white">Team Members</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-16rem)] overflow-auto">
                    <div className="relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                                <TableRow className="border-zinc-800">
                                    <TableHead className="w-[300px] text-zinc-400">Name</TableHead>
                                    <TableHead className="text-zinc-400">Email</TableHead>
                                    <TableHead className="text-zinc-400">Role</TableHead>
                                    <TableHead className="text-zinc-400">Last Active</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agentsData.map((agent) => (
                                    <TableRow key={agent.id} className="border-zinc-800">
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-800"></div>
                                                <div>{agent.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white">{agent.email}</TableCell>
                                        <TableCell className="text-white">{agent.role}</TableCell>
                                        <TableCell className="text-white">{agent.lastActive}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${agent.status === "Active" ? "bg-green-500/20 text-green-500" : "bg-zinc-500/20 text-zinc-400"
                                                    }`}
                                            >
                                                {agent.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
