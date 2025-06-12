import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

type Supplier = {
    id: number
    name: string
    address: string
    phone: string
    email: string
    created_at: string
}

interface SupplierFormDialogProps {
    onSupplierChange: () => void
    editingSupplier?: Supplier | null
    onEditComplete?: () => void
}

export default function SupplierFormDialog({
    onSupplierChange,
    editingSupplier,
    onEditComplete,
}: SupplierFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")

    // Effect to handle editing supplier changes
    useEffect(() => {
        if (editingSupplier) {
            setName(editingSupplier.name)
            setAddress(editingSupplier.address)
            setPhone(editingSupplier.phone)
            setEmail(editingSupplier.email)
            setOpen(true)
        }
    }, [editingSupplier])

    const resetForm = () => {
        setName("")
        setAddress("")
        setPhone("")
        setEmail("")
        setOpen(false)
        if (onEditComplete) {
            onEditComplete()
        }
    }

    const validateForm = () => {
        if (!name.trim()) {
            toast.error("Name is required", {
                description: "Please enter a valid supplier name",
            })
            return false
        }

        if (!email.trim()) {
            toast.error("Email is required", {
                description: "Please enter a valid email address",
            })
            return false
        }

        if (!phone.trim()) {
            toast.error("Phone is required", {
                description: "Please enter a valid phone number",
            })
            return false
        }

        if (!address.trim()) {
            toast.error("Address is required", {
                description: "Please enter a valid address",
            })
            return false
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            toast.error("Invalid email format", {
                description: "Please enter a valid email address",
            })
            return false
        }

        return true
    }

    const handleAddSupplier = async () => {
        if (!validateForm()) return

        try {
            const supplierData = {
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim(),
                email: email.trim(),
            }

            console.log("Sending create data:", supplierData) // Debug log

            const response = await api.post("/suppliers", supplierData)

            if (response.status >= 200 && response.status < 300) {
                onSupplierChange()
                resetForm()
                toast.success("Supplier added successfully", {
                    description: "The new supplier has been added to your system",
                })
            } else {
                toast.error("Failed to create supplier", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error creating supplier:", error)

            // Handle 422 validation errors specifically
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)

                if (typeof validationErrors === "object") {
                    // Handle Laravel-style validation errors
                    const errorMessages = Object.values(validationErrors).flat().join(", ")
                    toast.error("Validation Error", {
                        description: errorMessages,
                    })
                } else if (typeof validationErrors === "string") {
                    toast.error("Validation Error", {
                        description: validationErrors,
                    })
                } else {
                    toast.error("Validation Error", {
                        description: "Please check your input data",
                    })
                }
            } else {
                toast.error("Failed to create supplier", {
                    description: "An error occurred while creating the supplier",
                })
            }
        }
    }

    const handleUpdateSupplier = async () => {
        if (!editingSupplier) return
        if (!validateForm()) return

        try {
            const updateData: any = {}

            // Only include fields that have changed
            if (name.trim() !== editingSupplier.name) {
                updateData.name = name.trim()
            }
            if (address.trim() !== editingSupplier.address) {
                updateData.address = address.trim()
            }
            if (phone.trim() !== editingSupplier.phone) {
                updateData.phone = phone.trim()
            }
            if (email.trim() !== editingSupplier.email) {
                updateData.email = email.trim()
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
            const response = await api.patch(`/suppliers/${editingSupplier.id}`, updateData)

            if (response.status >= 200 && response.status < 300) {
                onSupplierChange()
                resetForm()
                toast.success("Supplier updated successfully", {
                    description: "The supplier information has been updated",
                })
            } else {
                toast.error("Failed to update supplier", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error updating supplier:", error)

            // Handle 422 validation errors specifically
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)

                if (typeof validationErrors === "object") {
                    // Handle Laravel-style validation errors
                    const errorMessages = Object.values(validationErrors).flat().join(", ")
                    toast.error("Validation Error", {
                        description: errorMessages,
                    })
                } else if (typeof validationErrors === "string") {
                    toast.error("Validation Error", {
                        description: validationErrors,
                    })
                } else {
                    toast.error("Validation Error", {
                        description: "Please check your input data",
                    })
                }
            } else {
                toast.error("Failed to update supplier", {
                    description: "An error occurred while updating the supplier",
                })
            }
        }
    }

    const handleSubmit = () => {
        if (editingSupplier) {
            handleUpdateSupplier()
        } else {
            handleAddSupplier()
        }
    }

    const handleAddClick = () => {
        resetForm()
        setOpen(true)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-neutral-900 text-white hover:bg-purple-600 transition-colors" onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-400">
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter supplier name"
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
                        <Label htmlFor="phone" className="text-zinc-400">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address" className="text-zinc-400">
                            Address
                        </Label>
                        <Input
                            id="address"
                            type="text"
                            placeholder="Enter address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
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
                    <Button className="bg-purple-600 hover:bg-purple-700 transition-colors" onClick={handleSubmit}>
                        {editingSupplier ? "Update Supplier" : "Add Supplier"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}