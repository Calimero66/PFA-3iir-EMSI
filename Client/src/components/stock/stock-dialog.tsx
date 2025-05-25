import type React from "react"

import { useState, useEffect } from "react"
import { ArrowRight, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarcodeDisplay } from "@/components/barcode-display"
import { BarcodeInput } from "@/components/barcode-input"
import api from "@/lib/api"

interface Category {
    id: number
    name: string
}

interface Supplier {
    id: number
    name: string
}

interface StockDialogProps {
    isEditing: boolean
    editingId: number | null
    onSubmit: (
        formData: {
            barcode: string
            name: string
            price: string
            quantity: string
            category_id: string
            supplier_id: string
            notes: string
        },
        isEditing: boolean,
        editingId: number | null,
        categoryName: string,
        supplierName: string,
    ) => void
    initialFormData?: {
        barcode: string
        name: string
        price: string
        quantity: string
        category_id: string
        supplier_id: string
        notes: string
    }
}

export function StockDialog({ isEditing, editingId, onSubmit, initialFormData }: StockDialogProps) {
    // State for dialog
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)

    // Form validation state
    const [formError, setFormError] = useState<string | null>(null)

    // Categories and suppliers state
    const [categories, setCategories] = useState<Category[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [suppliersLoading, setSuppliersLoading] = useState(false)

    // Form data state
    const [formData, setFormData] = useState({
        barcode: "",
        name: "",
        price: "",
        quantity: "",
        category_id: "",
        supplier_id: "",
        notes: "",
    })

    // Fetch categories and suppliers when dialog opens
    useEffect(() => {
        if (open) {
            fetchCategories()
            fetchSuppliers()
        }
    }, [open])

    // Update form data when editing an item
    useEffect(() => {
        if (initialFormData && isEditing) {
            setFormData(initialFormData)
        }
    }, [initialFormData, isEditing])

    const fetchCategories = async () => {
        setCategoriesLoading(true)
        try {
            const response = await api.get("/categories")
            console.log("🚀 ~ fetchCategories ~ response:", response)

            const categories = response.data.data

            setCategories(categories)

            console.log("🚀 ~ fetchCategories ~ categories:", categories)
        } catch (error) {
            console.error("Error fetching categories:", error)
            setCategories([])
        } finally {
            setCategoriesLoading(false)
        }
    }

    const fetchSuppliers = async () => {
        setSuppliersLoading(true)
        try {
            const response = await api.get("/suppliers")
            const suppliers = response.data.data
            setSuppliers(suppliers)
            console.log("🚀 ~ fetchSuppliers ~ suppliers:", suppliers)
        } catch (error) {
            console.error("Error fetching suppliers:", error)
            setSuppliers([])
        } finally {
            setSuppliersLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
        setFormError(null)
    }

    const handleBarcodeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, barcode: value }))
        setFormError(null)
    }

    const handleCategoryChange = (value: string) => {
        setFormData((prev) => ({ ...prev, category_id: value }))
        setFormError(null)
    }

    const handleSupplierChange = (value: string) => {
        setFormData((prev) => ({ ...prev, supplier_id: value }))
        setFormError(null)
    }

    const handleNextStep = () => {
        if (formData.barcode.length !== 12) {
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
        if (!formData.name || !formData.price || !formData.quantity || !formData.category_id || !formData.supplier_id) {
            setFormError("Please fill in all required fields")
            return
        }

        // Get category and supplier names for display
        const selectedCategory = categories.find((cat) => cat.id.toString() === formData.category_id)
        const selectedSupplier = suppliers.find((sup) => sup.id.toString() === formData.supplier_id)

        onSubmit(formData, isEditing, editingId, selectedCategory?.name || "", selectedSupplier?.name || "")
        resetForm()
        setOpen(false)
    }

    const resetForm = () => {
        setFormData({
            barcode: "",
            name: "",
            price: "",
            quantity: "",
            category_id: "",
            supplier_id: "",
            notes: "",
        })
        setStep(1)
        setFormError(null)
    }

    return (
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
                            <BarcodeDisplay barcodeNumber={formData.barcode || "9 578545 203541"} />
                            <BarcodeInput value={formData.barcode} onChange={handleBarcodeChange} />
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
                                Name *
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
                            <Label className="text-zinc-400">Category *</Label>
                            <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                            className="text-white hover:bg-zinc-700"
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-zinc-400">Supplier *</Label>
                            <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {suppliers.map((supplier) => (
                                        <SelectItem
                                            key={supplier.id}
                                            value={supplier.id.toString()}
                                            className="text-white hover:bg-zinc-700"
                                        >
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price" className="text-zinc-400">
                                Price *
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="Enter price"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                value={formData.price}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quantity" className="text-zinc-400">
                                Quantity *
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

                        <div className="grid gap-2">
                            <Label htmlFor="notes" className="text-zinc-400">
                                Notes
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter any additional notes"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                value={formData.notes}
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
    )
}
