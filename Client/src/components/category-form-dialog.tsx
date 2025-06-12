import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"

type Category = {
    id: number
    name: string
    description: string | null
    created_at: string
}

interface CategoryFormDialogProps {
    onCategoryChange: () => void
    editingCategory?: Category | null
    onEditComplete?: () => void
}

export default function CategoryFormDialog({
    onCategoryChange,
    editingCategory,
    onEditComplete,
}: CategoryFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    // Effect to handle editing category changes
    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name)
            setDescription(editingCategory.description || "")
            setOpen(true)
        }
    }, [editingCategory])

    const resetForm = () => {
        setName("")
        setDescription("")
        setOpen(false)
        if (onEditComplete) {
            onEditComplete()
        }
    }

    const validateForm = () => {
        if (!name.trim()) {
            toast.error("Name is required", {
                description: "Please enter a valid category name",
            })
            return false
        }

        return true
    }

    const handleAddCategory = async () => {
        if (!validateForm()) return

        try {
            const categoryData = {
                name: name.trim(),
                description: description.trim() || null,
            }

            console.log("Sending create data:", categoryData)

            const response = await api.post("/categories", categoryData)

            if (response.status >= 200 && response.status < 300) {
                onCategoryChange()
                resetForm()
                toast.success("Category added successfully", {
                    description: "The new category has been added to your system",
                })
            } else {
                toast.error("Failed to create category", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error creating category:", error)

            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)

                if (typeof validationErrors === "object") {
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
                toast.error("Failed to create category", {
                    description: "An error occurred while creating the category",
                })
            }
        }
    }

    const handleUpdateCategory = async () => {
        if (!editingCategory) return
        if (!validateForm()) return

        try {
            const updateData: any = {}

            // Only include fields that have changed
            if (name.trim() !== editingCategory.name) {
                updateData.name = name.trim()
            }
            if ((description.trim() || null) !== editingCategory.description) {
                updateData.description = description.trim() || null
            }

            // If no changes were made, just close the dialog
            if (Object.keys(updateData).length === 0) {
                toast.info("No changes detected", {
                    description: "No fields were modified",
                })
                resetForm()
                return
            }

            console.log("Sending update data:", updateData)

            const response = await api.patch(`/categories/${editingCategory.id}`, updateData)

            if (response.status >= 200 && response.status < 300) {
                onCategoryChange()
                resetForm()
                toast.success("Category updated successfully", {
                    description: "The category information has been updated",
                })
            } else {
                toast.error("Failed to update category", {
                    description: `Server returned status: ${response.status}`,
                })
            }
        } catch (error: any) {
            console.error("Error updating category:", error)

            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message
                console.log("Validation errors:", validationErrors)

                if (typeof validationErrors === "object") {
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
                toast.error("Failed to update category", {
                    description: "An error occurred while updating the category",
                })
            }
        }
    }

    const handleSubmit = () => {
        if (editingCategory) {
            handleUpdateCategory()
        } else {
            handleAddCategory()
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
                    Add Category
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-400">
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter category name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-zinc-400">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white resize-none h-20"
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
                        {editingCategory ? "Update Category" : "Add Category"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}