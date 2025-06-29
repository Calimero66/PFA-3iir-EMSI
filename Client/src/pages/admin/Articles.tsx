import { useState, useEffect } from "react"
import { Trash2, PencilLine, Eye, Download, QrCode } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArticleDialog } from "@/components/articles-dialog"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { exportArticleToPDF, exportArticleToHTML } from "@/utils/exportArticlePDF"
import { generateArticlePDFQRData, generateArticleInfoQRData, getQRCodeTitle, getQRCodeDescription } from "@/utils/qrCodeUtils"
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
    const [qrDialogOpen, setQrDialogOpen] = useState(false)
    const [qrArticle, setQrArticle] = useState<ArticleItem | null>(null)
    const [qrDataType, setQrDataType] = useState<'pdf' | 'info'>('pdf')

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
    console.log("👤 User role check:", { user, userRole, canEditDelete })

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
        // Check permissions before allowing create/edit
        if (isEditing && !canEditDelete) {
            toast.error("Access Denied", {
                description: "You don't have permission to edit articles. Contact your administrator.",
                duration: 5000,
            })
            throw new Error("Insufficient permissions")
        } else if (!isEditing && !canAdd) {
            toast.error("Access Denied", {
                description: "You don't have permission to create articles. Contact your administrator.",
                duration: 5000,
            })
            throw new Error("Insufficient permissions")
        }

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
                toast.success("Article updated successfully", {
                    description: `${formData.name} has been updated`,
                    duration: 3000,
                })
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
                    console.log("🔄 Refreshing article list to get complete data with relationships...")
                    await fetchArticleItems(false) // No loading state - instant update like categories
                    console.log("✅ New article added and list refreshed successfully")
                    toast.success("Article created successfully", {
                        description: `${formData.name} has been added to inventory`,
                        duration: 3000,
                    })
                } else {
                    console.error("❌ Invalid API response format:", response)
                    // Fallback: refresh the entire list
                    console.log("🔄 Refreshing article list as fallback...")
                    await fetchArticleItems(false) // No loading state
                }
            }

            // Reset editing state
            console.log("✅ Resetting editing state after successful submission")
            setIsEditing(false)
            setEditingId(null)
            setInitialFormData(undefined)
        } catch (error: any) {
            console.error("❌ Error saving article item:", error)

            // Extract error message from API response
            let errorMessage = "Failed to save article. Please try again."

            if (error.response?.data?.message) {
                // Use the specific error message from the API
                errorMessage = error.response.data.message
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const errors = error.response.data.errors
                if (typeof errors === 'object') {
                    errorMessage = Object.values(errors).flat().join(', ')
                } else if (typeof errors === 'string') {
                    errorMessage = errors
                }
            } else if (error.message) {
                errorMessage = error.message
            }

            // Show error toast notification
            toast.error("Failed to save article", {
                description: errorMessage,
                duration: 5000,
            })
            console.log("🚨 API Error:", errorMessage)

            // Throw the error so the dialog can handle it
            throw new Error(errorMessage)
        }
    }

    const handleViewArticle = (item: ArticleItem) => {
        setSelectedArticle(item)
        setViewDialogOpen(true)
    }

    // Handle QR code generation
    const handleGenerateQR = (article: ArticleItem, type: 'pdf' | 'info' = 'pdf') => {
        setQrArticle(article)
        setQrDataType(type)
        setQrDialogOpen(true)
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
        // Check permissions before allowing edit
        if (!canEditDelete) {
            toast.error("Access Denied", {
                description: "You don't have permission to edit articles. Contact your administrator.",
                duration: 5000,
            })
            return
        }

        const item = articleItem.find((item) => item.id === id)
        if (item) {
            console.log("🔧 Starting edit for article:", id, item)
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

    const handleDialogClose = () => {
        console.log("🔄 Resetting editing state")
        setIsEditing(false)
        setEditingId(null)
        setInitialFormData(undefined)
    }

    const handleDelete = async (id: number) => {
        // Check permissions before allowing delete
        if (!canEditDelete) {
            toast.error("Access Denied", {
                description: "You don't have permission to delete articles. Contact your administrator.",
                duration: 5000,
            })
            return
        }

        const item = articleItem.find((item) => item.id === id)
        const itemName = item?.name || "Article"

        if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
            try {
                await api.delete(`/articles/${id}`)
                setArticleItem((prev) => prev.filter((item) => item.id !== id))
                toast.success("Article deleted successfully", {
                    description: `${itemName} has been removed from inventory`,
                    duration: 3000,
                })
            } catch (error: any) {
                console.error("Error deleting article item:", error)
                const errorMessage = error.response?.data?.message || "Failed to delete article"
                toast.error("Failed to delete article", {
                    description: errorMessage,
                    duration: 5000,
                })
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Article Management</h1>
                        <p className="text-zinc-400">Manage your inventory items</p>
                        {!canAdd && (
                            <p className="text-yellow-400 text-sm mt-1">
                                ⚠️ View-only access - Contact admin for permissions
                            </p>
                        )}
                        {canAdd && !canEditDelete && (
                            <p className="text-green-400 text-sm mt-1">
                                ℹ️ Agent access - You can add articles but cannot edit/delete existing ones
                            </p>
                        )}
                    </div>

                    {/* Add Article button - for Admin, Manager, and Agent */}
                    {canAdd && (
                        <ArticleDialog
                            isEditing={isEditing}
                            editingId={editingId}
                            initialFormData={initialFormData}
                            onSubmit={addArticle}
                            onDialogClose={handleDialogClose}
                        />
                    )}
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex flex-col">
                            <CardTitle className="text-white">Article Items</CardTitle>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-zinc-400">
                                    {articleItem.length} {articleItem.length === 1 ? "item" : "items"} in inventory
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(userRole)}`}>
                                    {userRole || 'Unknown'} • {
                                        canEditDelete
                                            ? 'Full Access'
                                            : canAdd
                                            ? 'Add Only'
                                            : 'View Only'
                                    }
                                </span>
                            </div>
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
                                                    {/* View button - always visible */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                                        onClick={() => handleViewArticle(item)}
                                                        title="View Article"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {/* QR Code button - always visible */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                                        onClick={() => handleGenerateQR(item, 'pdf')}
                                                        title="Generate QR Code for PDF Download"
                                                    >
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>

                                                    {/* Edit button - only for Admin and Manager */}
                                                    {canEditDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                            onClick={() => handleEdit(item.id)}
                                                            title="Edit Article"
                                                        >
                                                            <PencilLine className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Delete button - only for Admin and Manager */}
                                                    {canEditDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            onClick={() => handleDelete(item.id)}
                                                            title="Delete Article"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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

                                {/* Export and QR Code Buttons */}
                                <div className="flex justify-center gap-3 pt-4 border-t border-zinc-800">
                                    <Button
                                        variant="outline"
                                        className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white transition-colors"
                                        onClick={() => handleExportArticle(selectedArticle)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Article Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-green-600 hover:bg-green-700 border-green-600 text-white transition-colors"
                                        onClick={() => handleGenerateQR(selectedArticle, 'pdf')}
                                    >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Generate QR Code
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* QR Code Dialog */}
                <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                        {qrArticle && (
                            <div className="space-y-6">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-white">
                                        {getQRCodeTitle(qrDataType === 'pdf' ? 'article-pdf' : 'article-info', qrArticle.name)}
                                    </DialogTitle>
                                    <p className="text-zinc-400">
                                        {getQRCodeDescription(qrDataType === 'pdf' ? 'article-pdf' : 'article-info')}
                                    </p>
                                </DialogHeader>

                                <QRCodeGenerator
                                    data={qrDataType === 'pdf'
                                        ? generateArticlePDFQRData(qrArticle)
                                        : generateArticleInfoQRData(qrArticle)
                                    }
                                    size={250}
                                    title=""
                                    description=""
                                    showDownload={true}
                                    showCopy={true}
                                    className="py-4"
                                />

                                <div className="flex justify-center gap-2 pt-4 border-t border-zinc-800">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQrDataType(qrDataType === 'pdf' ? 'info' : 'pdf')}
                                        className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-white transition-colors"
                                    >
                                        Switch to {qrDataType === 'pdf' ? 'Info' : 'PDF'} QR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQrDialogOpen(false)}
                                        className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white transition-colors"
                                    >
                                        Close
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
