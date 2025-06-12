import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

type Agent = {
    id: number
    name: string
    email: string
    role: string
    created_at: string
}

interface UserFormDialogProps {
    onUserChange: () => void
    editingAgent?: Agent | null
    onEditComplete?: () => void
}

export default function UserFormDialog({ onUserChange, editingAgent, onEditComplete }: UserFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState("")

    // Effect to handle editing agent changes
    useEffect(() => {
        if (editingAgent) {
            setName(editingAgent.name)
            setEmail(editingAgent.email)
            setRole(editingAgent.role)
            setPassword("")
            setConfirmPassword("")
            setOpen(true)
        }
    }, [editingAgent])

    const resetForm = () => {
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setRole("")
        setOpen(false)
        if (onEditComplete) {
            onEditComplete()
        }
    }

    const handleAddUser = async () => {
        // Validation checks
        if (!name.trim()) {
            toast.error("Name is required", {
                description: "Please enter a valid name",
            })
            return
        }

        if (!email.trim()) {
            toast.error("Email is required", {
                description: "Please enter a valid email address",
            })
            return
        }

        if (!password.trim()) {
            toast.error("Password is required", {
                description: "Please enter a password",
            })
            return
        }

        if (!role) {
            toast.error("Role is required", {
                description: "Please select a role",
            })
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match", {
                description: "Please make sure your passwords match",
            })
            return
        }

        try {
            const userData = {
                name: name.trim(),
                email: email.trim(),
                password: password,
                password_confirmation: confirmPassword,
                role: role,
            }

            console.log("Sending create data:", userData) // Debug log

            const response = await api.post("/users", userData)

            if (response.status >= 200 && response.status < 300) {
                onUserChange()
                resetForm()
                toast.success("Agent added successfully", {
                    description: "The new agent has been added to your team",
                })
            } else {
                toast.error("Failed to create agent", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error creating agent:", error)
            
            // Handle 422 validation errors specifically
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)
                
                if (typeof validationErrors === 'object') {
                    // Handle Laravel-style validation errors
                    const errorMessages = Object.values(validationErrors).flat().join(', ')
                    toast.error("Validation Error", {
                        description: errorMessages,
                    })
                } else if (typeof validationErrors === 'string') {
                    toast.error("Validation Error", {
                        description: validationErrors,
                    })
                } else {
                    toast.error("Validation Error", {
                        description: "Please check your input data",
                    })
                }
            } else {
                toast.error("Failed to create agent", {
                    description: "An error occurred while creating the agent",
                })
            }
        }
    }

    const handleUpdateUser = async () => {
        if (!editingAgent) return

        // Validation checks
        if (!name.trim()) {
            toast.error("Name is required", {
                description: "Please enter a valid name",
            })
            return
        }

        if (!email.trim()) {
            toast.error("Email is required", {
                description: "Please enter a valid email address",
            })
            return
        }

        if (!role) {
            toast.error("Role is required", {
                description: "Please select a role",
            })
            return
        }

        if ((password || confirmPassword) && password !== confirmPassword) {
            toast.error("Passwords do not match", {
                description: "Please make sure your passwords match",
            })
            return
        }

        try {
            const updateData: any = {}

            // Only include fields that have changed
            if (name.trim() !== editingAgent.name) {
                updateData.name = name.trim()
            }
            if (email.trim() !== editingAgent.email) {
                updateData.email = email.trim()
            }
            if (role !== editingAgent.role) {
                updateData.role = role
            }

            // Only include password fields if user wants to change password
            if (password && password.trim()) {
                updateData.password = password
                updateData.password_confirmation = confirmPassword
            }

            // If no changes were made, just close the dialog
            if (Object.keys(updateData).length === 0) {
                toast.info("No changes detected", {
                    description: "No fields were modified",
                })
                resetForm()
                return
            }

            console.log("Sending update data:", updateData) // Debug log

            // Use PATCH instead of PUT for partial updates
            const response = await api.patch(`/users/${editingAgent.id}`, updateData)

            if (response.status >= 200 && response.status < 300) {
                onUserChange()
                resetForm()
                toast.success("Agent updated successfully", {
                    description: "The agent information has been updated",
                })
            } else {
                toast.error("Failed to update agent", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error updating agent:", error)
            
            // Handle 422 validation errors specifically
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)
                
                if (typeof validationErrors === 'object') {
                    // Handle Laravel-style validation errors
                    const errorMessages = Object.values(validationErrors).flat().join(', ')
                    toast.error("Validation Error", {
                        description: errorMessages,
                    })
                } else if (typeof validationErrors === 'string') {
                    toast.error("Validation Error", {
                        description: validationErrors,
                    })
                } else {
                    toast.error("Validation Error", {
                        description: "Please check your input data",
                    })
                }
            } else {
                toast.error("Failed to update agent", {
                    description: "An error occurred while updating the agent",
                })
            }
        }
    }

    const handleSubmit = () => {
        if (editingAgent) {
            handleUpdateUser()
        } else {
            handleAddUser()
        }
    }

    const handleAddClick = () => {
        resetForm()
        setOpen(true)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-neutral-900 text-white hover:bg-purple-600 transition-colors"
                    onClick={handleAddClick}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agent
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {editingAgent ? "Edit Agent" : "Add New Agent"}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-400">
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter full name"
                            value={name}
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-zinc-400">
                            {editingAgent ? "New Password (optional)" : "Password"}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={editingAgent ? "Leave blank to keep current password" : "Enter password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-400">
                            {editingAgent ? "Confirm New Password" : "Confirm Password"}
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
                            <option value="" disabled>
                                Select a role
                            </option>
                            <option value="Admin" className="text-white">
                                Admin
                            </option>
                            <option value="Manager" className="text-white">
                                Manager
                            </option>
                            <option value="Agent" className="text-white">
                                Agent
                            </option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={resetForm}
                        className="border-zinc-700 bg-zinc-800 text-white hover:text-zinc-800 hover:bg-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 transition-colors"
                        onClick={handleSubmit}
                    >
                        {editingAgent ? "Update Agent" : "Add Agent"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}