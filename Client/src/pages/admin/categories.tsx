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
import CategoryFormDialog from "@/components/category-form-dialog"

type Category = {
    id: number
    name: string
    description: string | null
    created_at: string
}

export default function CategoriesPage() {
    const [alertOpen, setAlertOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
    const [categoriesData, setCategoriesData] = useState<Category[]>([])
    const [filteredCategoriesData, setFilteredCategoriesData] = useState<Category[]>([])
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await api.get("/categories")
            console.log("API Response:", response.data)
            
            if (response.status === 200) {
                const categories = response.data.data || response.data
                if (categories && Array.isArray(categories)) {
                    setCategoriesData(categories)
                    setFilteredCategoriesData(categories)
                    console.log("Categories loaded:", categories.length)
                } else {
                    console.log("No categories found or invalid format")
                    setCategoriesData([])
                    setFilteredCategoriesData([])
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
            setCategoriesData([])
            setFilteredCategoriesData([])
        }
    }

    const handleEdit = (id: number) => {
        const category = categoriesData.find((c) => c.id === id)
        if (category) {
            setEditingCategory(category)
        }
    }

    const handleEditComplete = () => {
        setEditingCategory(null)
    }

    const handleDeleteClick = (id: number) => {
        setCategoryToDelete(id)
        setAlertOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return

        try {
            const response = await api.delete(`/categories/${categoryToDelete}`)
            if (response.status === 200) {
                const updatedCategories = categoriesData.filter((category) => category.id !== categoryToDelete)
                setCategoriesData(updatedCategories)
                setFilteredCategoriesData(updatedCategories)
                toast.success("Category deleted successfully", {
                    description: "The category has been removed from the system",
                })
            }
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Failed to delete category", {
                description: "An error occurred while deleting the category",
            })
        } finally {
            setAlertOpen(false)
            setCategoryToDelete(null)
        }
    }

    const handleDeleteCancel = () => {
        setAlertOpen(false)
        setCategoryToDelete(null)
    }

    const handleFilter = (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setFilteredCategoriesData(categoriesData)
        } else {
            const filtered = categoriesData.filter(
                (category) =>
                    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            setFilteredCategoriesData(filtered)
        }
    }

    const categoryToDeleteName = categoryToDelete
        ? categoriesData.find((category) => category.id === categoryToDelete)?.name || "this category"
        : "this category"

    return (
        <div className="p-6 space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Category Management</h1>
                    <p className="text-zinc-400">Manage your product categories</p>
                </div>
                <CategoryFormDialog
                    onCategoryChange={fetchCategories}
                    editingCategory={editingCategory}
                    onEditComplete={handleEditComplete}
                />
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Category</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete <span className="font-semibold text-white">{categoryToDeleteName}</span>?
                            This action cannot be undone and will permanently remove the category from your system.
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
                    <CardTitle className="text-white">Categories</CardTitle>
                    <input
                        type="text"
                        placeholder="Search categories..."
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
                                    <TableHead className="text-zinc-400">Description</TableHead>
                                    <TableHead className="text-zinc-400">Created At</TableHead>
                                    <TableHead className="text-zinc-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.isArray(filteredCategoriesData.length > 0 ? filteredCategoriesData : categoriesData) &&
                                    (filteredCategoriesData.length > 0 ? filteredCategoriesData : categoriesData).map((category) => (
                                        <TableRow key={category.id} className="border-zinc-800">
                                            <TableCell className="font-medium text-white">{category.name}</TableCell>
                                            <TableCell className="text-white">{category.description || "-"}</TableCell>
                                            <TableCell className="text-white">{new Date(category.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                        onClick={() => handleEdit(category.id)}
                                                        title="Edit Category"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        title="Delete Category"
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