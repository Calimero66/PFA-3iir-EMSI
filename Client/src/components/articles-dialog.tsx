import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { ArrowRight, ArrowLeft, Plus, Search, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
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

interface ArticleDialogProps {
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
    ) => Promise<void>
    initialFormData?: {
        barcode: string
        name: string
        price: string
        quantity: string
        category_id: string
        supplier_id: string
        notes: string
    }
    onDialogClose?: () => void
}

export function ArticleDialog({ isEditing, editingId, onSubmit, initialFormData, onDialogClose }: ArticleDialogProps) {
    // State for dialog
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)
    
    // Form validation state
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Categories and suppliers state
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [suppliersLoading, setSuppliersLoading] = useState(false)

    // Search states for real-time filtering
    const [categorySearch, setCategorySearch] = useState("")
    const [supplierSearch, setSupplierSearch] = useState("")
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)

    // Store all data for client-side filtering
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])

    // Refs for dropdown management
    const categoryDropdownRef = useRef<HTMLDivElement>(null)
    const supplierDropdownRef = useRef<HTMLDivElement>(null)
    
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
    
    // Fetch categories and suppliers when dialog opens (only once)
    useEffect(() => {
        if (open && allCategories.length === 0) {
            fetchCategories()
        }
        if (open && allSuppliers.length === 0) {
            fetchSuppliers()
        }
    }, [open, allCategories.length, allSuppliers.length])

    // Update form data when editing an item and open dialog
    useEffect(() => {
        if (initialFormData && isEditing) {
            setFormData(initialFormData)
            setOpen(true) // Open dialog when editing
            setStep(1) // Start at step 1 for editing so user can modify barcode if needed
        }
    }, [initialFormData, isEditing])

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setCategoryDropdownOpen(false)
            }
            if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
                setSupplierDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Client-side filtering for real-time search
    const filteredCategories = useMemo(() => {
        console.log("Filtering categories. Search:", categorySearch, "All categories:", allCategories.length)
        let filtered = allCategories;
        if (categorySearch.trim()) {
            filtered = allCategories.filter(category =>
                category.name.toLowerCase().includes(categorySearch.toLowerCase())
            );
            console.log("Filtered results:", filtered.length)
        }
        const result = filtered.slice(0, 50); // Limit to 50 items for performance
        console.log("Final result:", result.length)
        return result;
    }, [allCategories, categorySearch])

    // Client-side filtering for real-time search
    const filteredSuppliers = useMemo(() => {
        let filtered = allSuppliers;
        if (supplierSearch.trim()) {
            filtered = allSuppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
            );
        }
        return filtered.slice(0, 50); // Limit to 50 items for performance
    }, [allSuppliers, supplierSearch])
    
    const fetchCategories = async () => {
        // Prevent multiple simultaneous requests
        if (categoriesLoading) return

        setCategoriesLoading(true)
        try {
            const response = await api.get('/categories')

            // More defensive data handling
            const categoriesData = response?.data?.data || response?.data || [];
            if (Array.isArray(categoriesData)) {
                setAllCategories(categoriesData);
                console.log(`Categories loaded: ${categoriesData.length} items`, categoriesData)
            } else {
                console.warn("Categories data is not an array:", categoriesData)
                setAllCategories([])
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
            setAllCategories([])
            setFormError("Failed to load categories. Please try again.")
        } finally {
            setCategoriesLoading(false)
        }
    }

    const fetchSuppliers = async () => {
        // Prevent multiple simultaneous requests
        if (suppliersLoading) return

        setSuppliersLoading(true)
        try {
            const response = await api.get('/suppliers')

            // More defensive data handling
            const suppliersData = response?.data?.data || response?.data || [];
            if (Array.isArray(suppliersData)) {
                setAllSuppliers(suppliersData);
                console.log(`Suppliers loaded: ${suppliersData.length} items`)
            } else {
                console.warn("Suppliers data is not an array:", suppliersData)
                setAllSuppliers([])
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error)
            setAllSuppliers([])
            setFormError("Failed to load suppliers. Please try again.")
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

    const handleSubmit = async () => {
        // Validate form data
        if (!formData.name || !formData.price || !formData.quantity || !formData.category_id || !formData.supplier_id) {
            setFormError("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        setFormError(null)

        try {
            // Get category and supplier names for display with safe lookups
            const selectedCategory = allCategories.find((cat) => cat?.id?.toString() === formData.category_id)
            const selectedSupplier = allSuppliers.find((sup) => sup?.id?.toString() === formData.supplier_id)

            await onSubmit(
                formData,
                isEditing,
                editingId,
                selectedCategory?.name || "",
                selectedSupplier?.name || ""
            )

            resetForm()
            setOpen(false)
        } catch (error: any) {
            console.error("Error submitting form:", error)
            // Use the specific error message from the API if available
            const errorMessage = error.message || "Failed to save article. Please try again."
            setFormError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
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
        setIsSubmitting(false)

        // Reset search states
        setCategorySearch("")
        setSupplierSearch("")
        setCategoryDropdownOpen(false)
        setSupplierDropdownOpen(false)
    }

    // Alternative approach - don't use DialogTrigger at all
    return (
        <>
            <Button
                type="button"
                className="bg-neutral-900 text-white hover:bg-purple-600 transition-colors"
                onClick={() => setOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Article
            </Button>
            
            {open && (
                <Dialog
                    open={open}
                    onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            resetForm()
                            onDialogClose?.() // Call the callback to reset editing state
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[550px] md:max-w-[600px] bg-zinc-900 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {isEditing
                                    ? step === 1
                                        ? "Edit article - Step 1"
                                        : "Edit article - Step 2"
                                    : step === 1
                                        ? "Add New article - Step 1"
                                        : "Add New article - Step 2"}
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
                                    <div className="relative" ref={categoryDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <span>
                                                {formData.category_id
                                                    ? allCategories.find(cat => cat.id.toString() === formData.category_id)?.name || "Select category..."
                                                    : categoriesLoading ? "Loading categories..." : "Select category..."
                                                }
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>

                                        {categoryDropdownOpen && (
                                            <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg">
                                                <div className="flex items-center px-3 py-2 border-b border-zinc-700">
                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <Input
                                                        placeholder="Search categories..."
                                                        value={categorySearch}
                                                        onChange={(e) => setCategorySearch(e.target.value)}
                                                        className="h-8 w-full bg-transparent border-0 focus:ring-0 text-white placeholder:text-zinc-500"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-auto">
                                                    {categoriesLoading ? (
                                                        <div className="px-3 py-2 text-zinc-400 text-sm flex items-center gap-2">
                                                            <LoadingSpinner size="sm" />
                                                            Loading categories...
                                                        </div>
                                                    ) : filteredCategories.length === 0 ? (
                                                        <div className="px-3 py-2 text-zinc-400 text-sm">
                                                            {categorySearch ? "No categories found" : "No categories available"}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredCategories.map((category) => (
                                                                <button
                                                                    key={category.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleCategoryChange(category.id.toString())
                                                                        setCategoryDropdownOpen(false)
                                                                        setCategorySearch("")
                                                                    }}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-white hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
                                                                >
                                                                    <span className="flex-1 text-left">{category.name}</span>
                                                                    {formData.category_id === category.id.toString() && (
                                                                        <Check className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                            {filteredCategories.length === 50 && (
                                                                <div className="px-3 py-2 text-zinc-500 text-xs border-t border-zinc-700">
                                                                    Showing first 50 results. Use search to find more.
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-zinc-400">Supplier *</Label>
                                    <div className="relative" ref={supplierDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setSupplierDropdownOpen(!supplierDropdownOpen)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <span>
                                                {formData.supplier_id
                                                    ? allSuppliers.find(sup => sup.id.toString() === formData.supplier_id)?.name || "Select supplier..."
                                                    : suppliersLoading ? "Loading suppliers..." : "Select supplier..."
                                                }
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </button>

                                        {supplierDropdownOpen && (
                                            <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg">
                                                <div className="flex items-center px-3 py-2 border-b border-zinc-700">
                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                    <Input
                                                        placeholder="Search suppliers..."
                                                        value={supplierSearch}
                                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                                        className="h-8 w-full bg-transparent border-0 focus:ring-0 text-white placeholder:text-zinc-500"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-auto">
                                                    {suppliersLoading ? (
                                                        <div className="px-3 py-2 text-zinc-400 text-sm flex items-center gap-2">
                                                            <LoadingSpinner size="sm" />
                                                            Loading suppliers...
                                                        </div>
                                                    ) : filteredSuppliers.length === 0 ? (
                                                        <div className="px-3 py-2 text-zinc-400 text-sm">
                                                            {supplierSearch ? "No suppliers found" : "No suppliers available"}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredSuppliers.map((supplier) => (
                                                                <button
                                                                    key={supplier.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSupplierChange(supplier.id.toString())
                                                                        setSupplierDropdownOpen(false)
                                                                        setSupplierSearch("")
                                                                    }}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-white hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
                                                                >
                                                                    <span className="flex-1 text-left">{supplier.name}</span>
                                                                    {formData.supplier_id === supplier.id.toString() && (
                                                                        <Check className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                            {filteredSuppliers.length === 50 && (
                                                                <div className="px-3 py-2 text-zinc-500 text-xs border-t border-zinc-700">
                                                                    Showing first 50 results. Use search to find more.
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 transition-colors"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? (isEditing ? "Updating..." : "Adding...")
                                            : (isEditing ? "Update Item" : "Add Item")
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
