import type React from "react"

import { useState } from "react"
import { Trash2, PencilLine, Plus, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { BarcodeDisplay } from "@/components/barcode-display"
import { BarcodeInput } from "@/components/barcode-input"



// Define the StockItem type
interface StockItem {
    id: number
    name: string
    price: string
    barcode: string
    type: string
    supplier: string
    stock: number
    status: string
    statusColor: string
}

// Initial sample data
const initialStockItems: StockItem[] = [
    {
        id: 1,
        name: "Laptop Computers",
        price: "$1,299.99",
        barcode: "LAP-2023-001",
        type: "Electronics",
        supplier: "TechWorld Inc.",
        stock: 24,
        status: "In Stock",
        statusColor: "green",
    },
    {
        id: 2,
        name: "Office Chairs",
        price: "$249.99",
        barcode: "FUR-2023-045",
        type: "Furniture",
        supplier: "Office Essentials",
        stock: 8,
        status: "Low Stock",
        statusColor: "yellow",
    },
    {
        id: 3,
        name: "Printer Ink",
        price: "$89.99",
        barcode: "SUP-2023-112",
        type: "Supplies",
        supplier: "PrintMaster Co.",
        stock: 0,
        status: "Out of Stock",
        statusColor: "red",
    },
]

export default function StockPage() {
    // State for stock items
    const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems)

    // State for add/edit dialog
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Form validation state
    const [formError, setFormError] = useState<string | null>(null)

    // Form data state
    const [formData, setFormData] = useState({
        barcodeNumber: "",
        name: "",
        type: "",
        supplier: "",
        price: "",
        quantity: "",
    })

    // Function to get status color classes
    const getStatusClasses = (statusColor: string) => {
        switch (statusColor) {
            case "green":
                return "bg-green-500/20 text-green-500"
            case "yellow":
                return "bg-yellow-500/20 text-yellow-500"
            case "red":
                return "bg-red-500/20 text-red-500"
            default:
                return "bg-zinc-500/20 text-zinc-400"
        }
    }

    // Function to determine status based on quantity
    const getStatus = (quantity: number) => {
        if (quantity <= 0) {
            return { status: "Out of Stock", statusColor: "red" }
        } else if (quantity < 10) {
            return { status: "Low Stock", statusColor: "yellow" }
        } else {
            return { status: "In Stock", statusColor: "green" }
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
        setFormError(null) // Clear any error when user types
    }

    const handleBarcodeNumberChange = (value: string) => {
        setFormData((prev) => ({ ...prev, barcodeNumber: value }))
        setFormError(null) // Clear any error when user types
    }

    const handleNextStep = () => {
        if (formData.barcodeNumber.length !== 12) {
            setFormError("Please enter a 12-digit barcode number")
            return
        }
        setFormError(null)
        setStep(2)
    }

    const handlePrevStep = () => {
        setFormError(null)
        setStep(1)
    }

    const handleSubmit = () => {
        // Validate form data
        if (!formData.name || !formData.type || !formData.supplier || !formData.price || !formData.quantity) {
            setFormError("Please fill in all required fields")
            return
        }

        const quantity = Number.parseInt(formData.quantity)
        const { status, statusColor } = getStatus(quantity)

        if (isEditing && editingId) {
            // Update existing item
            setStockItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === editingId
                        ? {
                            ...item,
                            name: formData.name,
                            price: formData.price.startsWith("$") ? formData.price : `$${formData.price}`,
                            barcode: formData.barcodeNumber,
                            type: formData.type,
                            supplier: formData.supplier,
                            stock: quantity,
                            status,
                            statusColor,
                        }
                        : item,
                ),
            )
        } else {
            // Add new item
            const newId = stockItems.length > 0 ? Math.max(...stockItems.map((item) => item.id)) + 1 : 1

            const newItem: StockItem = {
                id: newId,
                name: formData.name,
                price: formData.price.startsWith("$") ? formData.price : `$${formData.price}`,
                barcode: formData.barcodeNumber,
                type: formData.type,
                supplier: formData.supplier,
                stock: quantity,
                status,
                statusColor,
            }

            setStockItems((prevItems) => [...prevItems, newItem])
        }

        // Reset form and close dialog
        resetForm()
        setOpen(false)
    }

    const resetForm = () => {
        setFormData({
            barcodeNumber: "",
            name: "",
            type: "",
            supplier: "",
            price: "",
            quantity: "",
        })
        setStep(1)
        setIsEditing(false)
        setEditingId(null)
        setFormError(null)
    }

    const handleEdit = (id: number) => {
        const itemToEdit = stockItems.find((item) => item.id === id)

        if (itemToEdit) {
            setFormData({
                barcodeNumber: itemToEdit.barcode,
                name: itemToEdit.name,
                type: itemToEdit.type,
                supplier: itemToEdit.supplier,
                price: itemToEdit.price.replace("$", ""),
                quantity: itemToEdit.stock.toString(),
            })

            setIsEditing(true)
            setEditingId(id)
            setStep(1) // Start at barcode step
            setOpen(true)
        }
    }

    const handleDelete = (id: number) => {
        const itemToDelete = stockItems.find((item) => item.id === id)

        if (itemToDelete) {
            setStockItems((prevItems) => prevItems.filter((item) => item.id !== id))
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Stock Management</h1>
                    <p className="text-zinc-400">Manage your inventory items</p>
                </div>
                <Dialog
                    open={open}
                    onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) resetForm()
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 transition-colors">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stock
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] md:max-w-[600px] bg-zinc-900 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {isEditing
                                    ? step === 1
                                        ? "Edit Stock - Step 1"
                                        : "Edit Stock - Step 2"
                                    : step === 1
                                        ? "Add New Stock - Step 1"
                                        : "Add New Stock - Step 2"}
                            </DialogTitle>
                        </DialogHeader>

                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-md mb-4">
                                {formError}
                            </div>
                        )}

                        {step === 1 ? (
                            <div className="py-4 px-1">
                                <div className="grid gap-5">
                                    <BarcodeDisplay barcodeNumber={formData.barcodeNumber || "9 578545 203541"} />
                                    <BarcodeInput value={formData.barcodeNumber} onChange={handleBarcodeNumberChange} />
                                    <div className="flex justify-end mt-4">
                                        <Button className="bg-purple-600 transition-colors" onClick={handleNextStep}>
                                            Next
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-zinc-400">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter product name"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className="text-zinc-400">
                                        Type
                                    </Label>
                                    <Input
                                        id="type"
                                        placeholder="Enter product type"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier" className="text-zinc-400">
                                        Supplier
                                    </Label>
                                    <Input
                                        id="supplier"
                                        placeholder="Enter supplier name"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-zinc-400">
                                        Price
                                    </Label>
                                    <Input
                                        id="price"
                                        placeholder="Enter price"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity" className="text-zinc-400">
                                        Quantity
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        placeholder="Enter quantity"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="flex justify-between mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevStep}
                                        className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button className="bg-purple-600 transition-colors" onClick={handleSubmit}>
                                        {isEditing ? "Update Item" : "Add Item"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Stock Items</CardTitle>
                    <div className="text-sm text-zinc-400">
                        {stockItems.length} {stockItems.length === 1 ? "item" : "items"} in inventory
                    </div>
                </CardHeader>
                <CardContent>
                    {stockItems.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500">
                            <p>No stock items found. Add your first item to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800">
                                    <TableHead className="text-zinc-400">Item</TableHead>
                                    <TableHead className="text-zinc-400">Barcode</TableHead>
                                    <TableHead className="text-zinc-400">Type</TableHead>
                                    <TableHead className="text-zinc-400">Supplier</TableHead>
                                    <TableHead className="text-zinc-400">Stock</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockItems.map((item) => (
                                    <TableRow key={item.id} className="border-zinc-800">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-800"></div>
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs">{item.price}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.barcode}</TableCell>
                                        <TableCell>{item.type}</TableCell>
                                        <TableCell>{item.supplier}</TableCell>
                                        <TableCell>{item.stock}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClasses(item.statusColor)}`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                    onClick={() => handleEdit(item.id)}
                                                >
                                                    <PencilLine className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}