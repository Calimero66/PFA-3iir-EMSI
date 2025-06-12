import { useState, useEffect } from "react"
import { Trash2, PencilLine, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArticleDialog } from "@/components/articles-dialog"
import { exportArticleToPDF, exportArticleToHTML } from "@/utils/exportArticlePDF"
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
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null)

    useEffect(() => {
        fetchArticleItems()
    }, [])

    const fetchArticleItems = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true)
            }
            const response = await api.get("/articles")
            console.log("🚀 ~ fetchArticleItems ~ response:", response)

            // Based on Laravel backend: GET /articles returns { data: articles }
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setArticleItem(response.data.data)
                console.log("📊 Loaded articles count:", response.data.data.length)
            } else if (Array.isArray(response.data)) {
                // Fallback if response format changes
                setArticleItem(response.data)
                console.log("📊 Loaded articles count:", response.data.length)
            } else {
                // Fallback to empty array if data format is unexpected
                console.error("Unexpected API response format:", response.data)
                setArticleItem([])
            }
        } catch (error) {
            console.error("Error fetching article items:", error)
            setArticleItem([]) // Ensure we reset to empty array on error
        } finally {
            if (showLoading) {
                setLoading(false)
            }
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
                console.log("🔄 Updating article:", editingId, payload)
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
                console.log("✅ Article updated successfully")
            } else {
                // Create new item
                console.log("➕ Creating new article:", payload)
                const response = await api.post("/articles", payload)
                console.log("🚀 ~ addArticle ~ API response:", response)

                // Based on Laravel backend: POST /articles returns { message, article, stock_supply }
                if (response.data && response.data.article) {
                    // The new article is under response.data.article
                    const newArticle = response.data.article
                    console.log("📝 Adding new article to state:", newArticle)

                    // We need to load the article with relationships (category, supplier, user)
                    // Since the POST response might not include these relationships, let's refresh the list
                    console.log("� Refreshing article list to get complete data with relationships...")
                    await fetchArticleItems(false) // No loading state - instant update like categories
                    console.log("✅ New article added and list refreshed successfully")
                } else {
                    console.error("❌ Invalid API response format:", response)
                    // Fallback: refresh the entire list
                    console.log("🔄 Refreshing article list as fallback...")
                    await fetchArticleItems(false) // No loading state
                }
            }

            // Reset editing state
            setIsEditing(false)
            setEditingId(null)
            setInitialFormData(undefined)
        } catch (error) {
            console.error("❌ Error saving article item:", error)
            // On error, refresh the list to ensure consistency
            console.log("🔄 Refreshing article list due to error...")
            await fetchArticleItems(false) // No loading state
        }
    }

    const handleViewArticle = (item: ArticleItem) => {
        setSelectedArticle(item)
        setViewDialogOpen(true)
    }

    // Handle export with fallback options
    const handleExportArticle = (article: ArticleItem) => {
        try {
            console.log('Attempting to export article:', article.id)
            exportArticleToPDF(article)
        } catch (error) {
            console.error('PDF export failed, trying HTML export:', error)
            exportArticleToHTML(article)
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
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                                        onClick={() => handleViewArticle(item)}
                                                        title="View Article"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                        onClick={() => handleEdit(item.id)}
                                                        title="Edit Article"
                                                    >
                                                        <PencilLine className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete Article"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

                {/* View Article Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                        {selectedArticle && (
                            <div className="space-y-6">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-white">Article Details</DialogTitle>
                                    <p className="text-zinc-400">Detailed information about the selected article</p>
                                </DialogHeader>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Article ID:</span>
                                            <span className="text-white">#{selectedArticle.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Barcode:</span>
                                            <span className="text-white">{selectedArticle.barcode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Name:</span>
                                            <span className="text-white font-medium">{selectedArticle.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Price:</span>
                                            <span className="text-white">${selectedArticle.price}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Quantity:</span>
                                            <span className="text-white">{selectedArticle.quantity} units</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Category:</span>
                                            <span className="text-white">{selectedArticle.category?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Supplier:</span>
                                            <span className="text-white">{selectedArticle.supplier?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Created By:</span>
                                            <span className="text-white">{selectedArticle.user?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Created At:</span>
                                            <span className="text-white">{new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Updated At:</span>
                                            <span className="text-white">{new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedArticle.notes && (
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-white">Notes</h3>
                                        <div className="bg-zinc-800 p-4 rounded-lg">
                                            <p className="text-zinc-300">{selectedArticle.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Export Button */}
                                <div className="flex justify-center pt-4 border-t border-zinc-800">
                                    <Button
                                        variant="outline"
                                        className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white transition-colors"
                                        onClick={() => handleExportArticle(selectedArticle)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Article Report
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
