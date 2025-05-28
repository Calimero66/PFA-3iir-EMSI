import { useState, useEffect } from "react"
import { Trash2, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArticleDialog } from "@/components/articles-dialog"
import api from "@/lib/api"

interface ArticleItem {
    id: number
    barcode: string
    name: string
    price: number | string
    quantity: number
    category_id: number
    supplier_id: number
    user_id: number
    category: {
        id: number
        name: string
    }
    supplier: {
        id: number
        name: string
    }
    user: {
        id: number
        name: string
    }
    notes?: string
    created_at: string
    updated_at: string
}

interface ArticleFormData {
    barcode: string
    name: string
    price: string
    quantity: string
    category_id: string
    supplier_id: string
    notes: string
}

export default function ArticlesPage() {
    const [articleItem, setArticleItem] = useState<ArticleItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [initialFormData, setInitialFormData] = useState<ArticleFormData | undefined>(undefined)

    useEffect(() => {
        fetcharticleItems()
    }, [])

    const fetcharticleItems = async () => {
        try {
            setLoading(true)
            const response = await api.get("/articles")
            console.log("🚀 ~ fetcharticleItems ~ response:", response)
            
            // Ensure we're setting an array to state
            if (Array.isArray(response.data)) {
                setArticleItem(response.data)
            } else if (response.data && typeof response.data === 'object') {
                // If response.data is an object that might contain the array
                // Check common API response patterns
                const items = response.data.articles || response.data.data || response.data.items || []
                setArticleItem(items)
            } else {
                // Fallback to empty array if data format is unexpected
                console.error("Unexpected API response format:", response.data)
                setArticleItem([])
            }
        } catch (error) {
            console.error("Error fetching article items:", error)
            setArticleItem([]) // Ensure we reset to empty array on error
        } finally {
            setLoading(false)
        }
    }

    const addArticle = async (
        formData: ArticleFormData,
        isEditing: boolean,
        editingId: number | null,
        categoryName: string,
        supplierName: string,
    ) => {
        try {
            const payload = {
                barcode: formData.barcode,
                name: formData.name,
                price: Number.parseFloat(formData.price),
                quantity: Number.parseInt(formData.quantity),
                category_id: Number.parseInt(formData.category_id),
                supplier_id: Number.parseInt(formData.supplier_id),
                notes: formData.notes,
            }

            if (isEditing && editingId) {
                // Update existing item
                await api.put(`/articles/${editingId}`, payload)

                // Update the item in local state with nested objects
                setArticleItem((prev) =>
                    prev.map((item) =>
                        item.id === editingId
                            ? {
                                ...item,
                                ...payload,
                                category: {
                                    id: Number.parseInt(formData.category_id),
                                    name: categoryName
                                },
                                supplier: {
                                    id: Number.parseInt(formData.supplier_id),
                                    name: supplierName
                                }
                            }
                            : item,
                    ),
                )
            } else {
                // Create new item
                const response = await api.post("/articles", payload)
                // The response now contains nested category and supplier
                setArticleItem((prev) => [...prev, response.data])
            }

            // Reset editing state
            setIsEditing(false)
            setEditingId(null)
            setInitialFormData(undefined)
        } catch (error) {
            console.error("Error saving article item:", error)
        }
    }

    const handleEdit = (id: number) => {
        const item = articleItem.find((item) => item.id === id)
        if (item) {
            setIsEditing(true)
            setEditingId(id)
            setInitialFormData({
                barcode: item.barcode,
                name: item.name,
                price: typeof item.price === 'string' ? item.price : item.price.toString(),
                quantity: item.quantity.toString(),
                category_id: item.category_id.toString(),
                supplier_id: item.supplier_id.toString(),
                notes: item.notes || "",
            })
        }
    }

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await api.delete(`/articles/${id}`)
                setArticleItem((prev) => prev.filter((item) => item.id !== id))
            } catch (error) {
                console.error("Error deleting article item:", error)
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white">
                <div className="p-6 space-y-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-zinc-400">Loading article items...</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Article Management</h1>
                        <p className="text-zinc-400">Manage your inventory items</p>
                    </div>

                    <ArticleDialog
                        isEditing={isEditing}
                        editingId={editingId}
                        initialFormData={initialFormData}
                        onSubmit={addArticle}
                    />
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Article Items</CardTitle>
                        <div className="text-sm text-zinc-400">
                            {articleItem.length} {articleItem.length === 1 ? "item" : "items"} in inventory
                        </div>
                    </CardHeader>
                    <CardContent>
                        {articleItem.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500">
                                <p>No article items found. Add your first item to get started.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead className="text-zinc-400">Barcode</TableHead>
                                        <TableHead className="text-zinc-400">Name</TableHead>
                                        <TableHead className="text-zinc-400">Price</TableHead>
                                        <TableHead className="text-zinc-400">Quantity</TableHead>
                                        <TableHead className="text-zinc-400">Category</TableHead>
                                        <TableHead className="text-zinc-400">Supplier</TableHead>
                                        <TableHead className="text-zinc-400">Created At</TableHead>
                                        <TableHead className="text-zinc-400">Updated At</TableHead>
                                        <TableHead className="text-zinc-400">User</TableHead>
                                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articleItem.map((item) => (
                                        <TableRow key={item.id} className="border-zinc-800">
                                            <TableCell className="text-zinc-300">{item.barcode}</TableCell>
                                            <TableCell className="text-zinc-300 font-medium">{item.name}</TableCell>
                                            <TableCell className="text-zinc-300">${item.price}</TableCell>
                                            <TableCell className="text-zinc-300">{item.quantity}</TableCell>
                                            <TableCell className="text-zinc-300">{item.category?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-zinc-300">{item.supplier?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-zinc-300 text-sm">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 text-sm">
                                                {new Date(item.updated_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-zinc-300">{item.user?.name || 'N/A'}</TableCell>
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
        </div>
    )
}
