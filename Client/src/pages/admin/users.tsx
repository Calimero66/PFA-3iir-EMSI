import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import api from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import UserFormDialog from "@/components/UserFormDialog"

type Agent = {
    id: number
    name: string
    email: string
    role: string
    created_at: string
}

export default function AgentsPage() {
    const [alertOpen, setAlertOpen] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState<number | null>(null)
    const [agentsData, setAgentsData] = useState<Agent[]>([])
    const [filteredAgentsData, setFilteredAgentsData] = useState<Agent[]>([])
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users")
            if (response.status === 200 && response.data.status === "success") {
                const users = response.data.data
                if (users) {
                    setAgentsData(users)
                    setFilteredAgentsData(users)
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            setAgentsData([])
            setFilteredAgentsData([])
        }
    }

    const handleEdit = (id: number) => {
        const agent = agentsData.find((a) => a.id === id)
        if (agent) {
            setEditingAgent(agent)
        }
    }

    const handleEditComplete = () => {
        setEditingAgent(null)
    }

    const handleDeleteClick = (id: number) => {
        setAgentToDelete(id)
        setAlertOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!agentToDelete) return

        try {
            const response = await api.delete(`/users/${agentToDelete}`)
            if (response.status === 200) {
                const updatedAgents = agentsData.filter((agent) => agent.id !== agentToDelete)
                setAgentsData(updatedAgents)
                setFilteredAgentsData(updatedAgents)
                toast.success("Agent deleted successfully", {
                    description: "The agent has been removed from the system",
                })
            }
        } catch (error) {
            console.error("Error deleting agent:", error)
            toast.error("Failed to delete agent", {
                description: "An error occurred while deleting the agent",
            })
        } finally {
            setAlertOpen(false)
            setAgentToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setAlertOpen(false)
        setAgentToDelete(null)
    }

    const handleFilter = (selectedRole: string) => {
        if (selectedRole === "All") {
            setFilteredAgentsData(agentsData)
        } else {
            const filtered = agentsData.filter((agent) => agent.role === selectedRole)
            setFilteredAgentsData(filtered)
        }
    }

    const agentToDeleteName = agentToDelete
        ? agentsData.find((agent) => agent.id === agentToDelete)?.name || "this agent"
        : "this agent"

    return (
        <div className="p-6 space-y-6">
            <Toaster position="bottom-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Agent Management</h1>
                    <p className="text-zinc-400">Manage your team members</p>
                </div>
                <UserFormDialog 
                    onUserChange={fetchUsers}
                    editingAgent={editingAgent}
                    onEditComplete={handleEditComplete}
                />
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Agent</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete <span className="font-semibold text-white">{agentToDeleteName}</span>?
                            This action cannot be undone and will permanently remove the agent from your system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={handleDeleteCancel}
                            className="border-zinc-700 bg-zinc-800 text-white hover:text-zinc-800 hover:bg-white"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="bg-zinc-900 border-zinc-800 h-full">
                <CardHeader>
                    <CardTitle className="text-white">Team Members</CardTitle>
                    <select
                        className="mt-2 w-48 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        onChange={(e) => handleFilter(e.target.value)}
                        defaultValue="All"
                    >
                        <option value="All">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Agent">Agent</option>
                    </select>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-16rem)] overflow-auto">
                    <div className="relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                                <TableRow className="border-zinc-800">
                                    <TableHead className="w-[300px] text-zinc-400">Name</TableHead>
                                    <TableHead className="text-zinc-400">Email</TableHead>
                                    <TableHead className="text-zinc-400">Role</TableHead>
                                    <TableHead className="text-zinc-400">created_at</TableHead>
                                    <TableHead className="text-zinc-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.isArray(filteredAgentsData.length > 0 ? filteredAgentsData : agentsData) &&
                                    (filteredAgentsData.length > 0 ? filteredAgentsData : agentsData).map((agent) => (
                                        <TableRow key={agent.id} className="border-zinc-800">
                                            <TableCell className="font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                        <AvatarFallback>CN</AvatarFallback>
                                                    </Avatar>
                                                    <div>{agent.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white">{agent.email}</TableCell>
                                            <TableCell className="text-white">
                                                <span
                                                    className={`px-2 py-1 rounded-md ${agent.role === "Admin"
                                                            ? "bg-red-500/20 text-red-500"
                                                            : agent.role === "Manager"
                                                                ? "bg-blue-500/20 text-blue-500"
                                                                : "bg-yellow-500/20 text-yellow-500"
                                                        }`}
                                                >
                                                    {agent.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-white">{new Date(agent.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                        onClick={() => handleEdit(agent.id)}
                                                        title="Edit User"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={() => handleDeleteClick(agent.id)}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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