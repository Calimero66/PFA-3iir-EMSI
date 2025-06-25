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
import SupplierFormDialog from "@/components/supplier-form-dialog"

type Supplier = {
    id: number
    name: string
    address: string
    phone: string
    email: string
    created_at: string
}

export default function SuppliersPage() {
    const [alertOpen, setAlertOpen] = useState(false)
    const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null)
    const [suppliersData, setSuppliersData] = useState<Supplier[]>([])
    const [filteredSuppliersData, setFilteredSuppliersData] = useState<Supplier[]>([])
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const userRole = user?.role || ""

    // Check permissions for different actions
    const canAdd = userRole === "Admin" || userRole === "Manager" || userRole === "Agent"
    const canEditDelete = userRole === "Admin" || userRole === "Manager"

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

    // Debug logging for role checking
    console.log("👤 Suppliers page - User role check:", { user, userRole, canAdd, canEditDelete })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const response = await api.get("/suppliers")
            console.log("API Response:", response.data) // Log full response to see structure
            
            // Remove strict check for response.data.status === "success"
            if (response.status === 200) {
                // Just try to access data wherever it might be
                const suppliers = response.data.data || response.data
                if (suppliers && Array.isArray(suppliers)) {
                    setSuppliersData(suppliers)
                    setFilteredSuppliersData(suppliers)
                    console.log("Suppliers loaded:", suppliers.length)
                } else {
                    console.log("No suppliers found or invalid format")
                    setSuppliersData([])
                    setFilteredSuppliersData([])
                }
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error)
            setSuppliersData([])
            setFilteredSuppliersData([])
        }
    }

    const handleEdit = (id: number) => {
        // Check permissions before allowing edit
        if (!canEditDelete) {
            toast.error("Access Denied", {
                description: "You don't have permission to edit suppliers. Contact your administrator.",
                duration: 5000,
            })
            return
        }

        const supplier = suppliersData.find((s) => s.id === id)
        if (supplier) {
            setEditingSupplier(supplier)
        }
    }

    const handleEditComplete = () => {
        setEditingSupplier(null)
    }

    const handleDeleteClick = (id: number) => {
        // Check permissions before allowing delete
        if (!canEditDelete) {
            toast.error("Access Denied", {
                description: "You don't have permission to delete suppliers. Contact your administrator.",
                duration: 5000,
            })
            return
        }

        setSupplierToDelete(id)
        setAlertOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!supplierToDelete) return

        try {
            const response = await api.delete(`/suppliers/${supplierToDelete}`)
            if (response.status === 200) {
                const updatedSuppliers = suppliersData.filter((supplier) => supplier.id !== supplierToDelete)
                setSuppliersData(updatedSuppliers)
                setFilteredSuppliersData(updatedSuppliers)
                toast.success("Supplier deleted successfully", {
                    description: "The supplier has been removed from the system",
                })
            }
        } catch (error) {
            console.error("Error deleting supplier:", error)
            toast.error("Failed to delete supplier", {
                description: "An error occurred while deleting the supplier",
            })
        } finally {
            setAlertOpen(false)
            setSupplierToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setAlertOpen(false)
        setSupplierToDelete(null)
    }

    const handleFilter = (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setFilteredSuppliersData(suppliersData)
        } else {
            const filtered = suppliersData.filter(
                (supplier) =>
                    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    supplier.address.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            setFilteredSuppliersData(filtered)
        }
    }

    const supplierToDeleteName = supplierToDelete
        ? suppliersData.find((supplier) => supplier.id === supplierToDelete)?.name || "this supplier"
        : "this supplier"

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        color: '#ffffff',
                    },
                }}
            />
            <div className="p-6 space-y-6">
            <Toaster position="bottom-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
                    <p className="text-zinc-400">Manage your suppliers</p>
                    {!canAdd && (
                        <p className="text-yellow-400 text-sm mt-1">
                            ⚠️ View-only access - Contact admin for permissions
                        </p>
                    )}
                    {canAdd && !canEditDelete && (
                        <p className="text-yellow-400 text-sm mt-1">
                                ⚠️ Limited access - Contact manager for delete/edit permissions
                            </p>
                    )}
                </div>

                {/* Add Supplier button - for Admin, Manager, and Agent */}
                {canAdd && (
                    <SupplierFormDialog
                        onSupplierChange={fetchSuppliers}
                        editingSupplier={editingSupplier}
                        onEditComplete={handleEditComplete}
                    />
                )}
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Supplier</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete <span className="font-semibold text-white">{supplierToDeleteName}</span>?
                            This action cannot be undone and will permanently remove the supplier from your system.
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <CardTitle className="text-white">Suppliers</CardTitle>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-zinc-400">
                                {filteredSuppliersData.length > 0 ? filteredSuppliersData.length : suppliersData.length} {(filteredSuppliersData.length > 0 ? filteredSuppliersData.length : suppliersData.length) === 1 ? "supplier" : "suppliers"} found
                            </span>
                            {userRole && (
                                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(userRole)}`}>
                                    {userRole || 'Unknown'} • {
                                        canEditDelete
                                            ? 'Full Access'
                                            : canAdd
                                            ? 'Add Only'
                                            : 'View Only'
                                    }
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            className="mt-2 w-64 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                            onChange={(e) => handleFilter(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-16rem)] overflow-auto">
                    <div className="relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                                <TableRow className="border-zinc-800">
                                    <TableHead className="w-[250px] text-zinc-400">Name</TableHead>
                                    <TableHead className="text-zinc-400">Email</TableHead>
                                    <TableHead className="text-zinc-400">Phone</TableHead>
                                    <TableHead className="text-zinc-400">Address</TableHead>
                                    <TableHead className="text-zinc-400">Created At</TableHead>
                                    <TableHead className="text-zinc-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.isArray(filteredSuppliersData.length > 0 ? filteredSuppliersData : suppliersData) &&
                                    (filteredSuppliersData.length > 0 ? filteredSuppliersData : suppliersData).map((supplier) => (
                                        <TableRow key={supplier.id} className="border-zinc-800">
                                            <TableCell className="font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                        <AvatarFallback>CN</AvatarFallback>
                                                    </Avatar>
                                                    <div>{supplier.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white">{supplier.email}</TableCell>
                                            <TableCell className="text-white">{supplier.phone}</TableCell>
                                            <TableCell className="text-white">{supplier.address}</TableCell>
                                            <TableCell className="text-white">{new Date(supplier.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {/* Edit button - only for Admin and Manager */}
                                                    {canEditDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                            onClick={() => handleEdit(supplier.id)}
                                                            title="Edit Supplier"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Delete button - only for Admin and Manager */}
                                                    {canEditDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            onClick={() => handleDeleteClick(supplier.id)}
                                                            title="Delete Supplier"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Show message for restricted users */}
                                                    {!canEditDelete && (
                                                        <span className="text-xs text-zinc-500 px-2 py-1">
                                                            View Only
                                                        </span>
                                                    )}
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
        </div>
    )
}
