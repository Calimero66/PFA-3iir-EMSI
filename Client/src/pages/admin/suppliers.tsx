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
        const supplier = suppliersData.find((s) => s.id === id)
        if (supplier) {
            setEditingSupplier(supplier)
        }
    }

    const handleEditComplete = () => {
        setEditingSupplier(null)
    }

    const handleDeleteClick = (id: number) => {
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
        <div className="p-6 space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
                    <p className="text-zinc-400">Manage your suppliers</p>
                </div>
                <SupplierFormDialog
                    onSupplierChange={fetchSuppliers}
                    editingSupplier={editingSupplier}
                    onEditComplete={handleEditComplete}
                />
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
                <CardHeader>
                    <CardTitle className="text-white">Suppliers</CardTitle>
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        className="mt-2 w-64 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        onChange={(e) => handleFilter(e.target.value)}
                    />
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                        onClick={() => handleEdit(supplier.id)}
                                                        title="Edit Supplier"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={() => handleDeleteClick(supplier.id)}
                                                        title="Delete Supplier"
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
