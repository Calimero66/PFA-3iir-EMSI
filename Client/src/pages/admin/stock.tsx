import { useState, useEffect } from "react"
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

type StockItem = {
    id: number
    article_id: number
    article_name: string
    article_barcode: string
    article_price: string
    category_name: string
    supplier_name: string
    quantity: number
    supply_date: string
    notes: string | null
    created_at: string
    updated_at: string
    article: {
        id: number
        barcode: string
        name: string
        price: string
        quantity: number
        category_id: number
        supplier_id: number
        user_id: number
        created_at: string
        updated_at: string
        category: {
            id: number
            name: string
            description: string | null
            created_at: string
            updated_at: string
        }
        supplier: {
            id: number
            name: string
            address: string
            phone: string
            email: string
            created_at: string
            updated_at: string
        }
    }
}

type StockStats = {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
}

export default function StockPage() {
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [filteredStockItems, setFilteredStockItems] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<StockStats>({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0
    })

    useEffect(() => {
        fetchStockItems()
    }, [])

    const fetchStockItems = async () => {
        try {
            setLoading(true)
            const response = await api.get("/stock-supplies")
            console.log("Stock API Response:", response.data)

            // Based on Laravel backend: GET /stock-supplies returns { data: stock_supplies }
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                const items = response.data.data
                setStockItems(items)
                setFilteredStockItems(items)
                calculateStats(items)
                console.log("Stock items loaded:", items.length)
            } else if (Array.isArray(response.data)) {
                // Fallback if response format changes
                setStockItems(response.data)
                setFilteredStockItems(response.data)
                calculateStats(response.data)
                console.log("Stock items loaded:", response.data.length)
            } else {
                console.error("Unexpected API response format:", response.data)
                setStockItems([])
                setFilteredStockItems([])
            }
        } catch (error) {
            console.error("Error fetching stock items:", error)
            setStockItems([])
            setFilteredStockItems([])
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (items: StockItem[]) => {
        const totalItems = items.length
        const lowStockItems = items.filter(item => item.quantity > 0 && item.quantity <= 10).length
        const outOfStockItems = items.filter(item => item.quantity === 0).length
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.article_price)), 0)

        setStats({
            totalItems,
            lowStockItems,
            outOfStockItems,
            totalValue
        })
    }

    const handleFilter = (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setFilteredStockItems(stockItems)
        } else {
            const filtered = stockItems.filter(
                (item) =>
                    item.article_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.article_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredStockItems(filtered)
        }
    }

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) {
            return { label: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle, color: "bg-red-600 text-white", useCustomColor: true }
        } else if (quantity <= 10) {
            return { label: "Low Stock", variant: "secondary" as const, icon: TrendingDown, color: "bg-yellow-600 text-white", useCustomColor: true }
        } else {
            return { label: "In Stock", variant: "default" as const, icon: TrendingUp, color: "", useCustomColor: false }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white">
                <div className="p-6 space-y-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-zinc-400">Loading stock data...</div>
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
                        <h1 className="text-2xl font-bold text-white">Stock Management</h1>
                        <p className="text-zinc-400">Monitor and manage your inventory levels</p>
                    </div>
                </div>

                {/* Stock Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-zinc-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
                            <p className="text-xs text-zinc-500">Items in inventory</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Low Stock</CardTitle>
                            <TrendingDown className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-500">{stats.lowStockItems}</div>
                            <p className="text-xs text-zinc-500">Items with ≤10 units</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Out of Stock</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{stats.outOfStockItems}</div>
                            <p className="text-xs text-zinc-500">Items with 0 units</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">${stats.totalValue.toFixed(2)}</div>
                            <p className="text-xs text-zinc-500">Total inventory value</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Items Table */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Stock Items</CardTitle>
                        <div className="text-sm text-zinc-400">
                            {filteredStockItems.length} {filteredStockItems.length === 1 ? "item" : "items"} in stock
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search Input */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by name, barcode, category, or supplier..."
                                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                                onChange={(e) => handleFilter(e.target.value)}
                            />
                        </div>

                        {filteredStockItems.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500">
                                <p>No stock items found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead className="text-zinc-400">Barcode</TableHead>
                                        <TableHead className="text-zinc-400">Name</TableHead>
                                        <TableHead className="text-zinc-400">Category</TableHead>
                                        <TableHead className="text-zinc-400">Supplier</TableHead>
                                        <TableHead className="text-zinc-400">Quantity</TableHead>
                                        <TableHead className="text-zinc-400">Unit Price</TableHead>
                                        <TableHead className="text-zinc-400">Total Value</TableHead>
                                        <TableHead className="text-zinc-400">Supply Date</TableHead>
                                        <TableHead className="text-zinc-400">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStockItems.map((item) => {
                                        const status = getStockStatus(item.quantity)
                                        const StatusIcon = status.icon
                                        const totalValue = item.quantity * parseFloat(item.article_price)

                                        return (
                                            <TableRow key={item.id} className="border-zinc-800">
                                                <TableCell className="text-zinc-300 font-mono">{item.article_barcode}</TableCell>
                                                <TableCell className="text-zinc-300 font-medium">{item.article_name}</TableCell>
                                                <TableCell className="text-zinc-300">{item.category_name || 'N/A'}</TableCell>
                                                <TableCell className="text-zinc-300">{item.supplier_name || 'N/A'}</TableCell>
                                                <TableCell className="text-zinc-300">{item.quantity}</TableCell>
                                                <TableCell className="text-zinc-300">${item.article_price}</TableCell>
                                                <TableCell className="text-zinc-300">${totalValue.toFixed(2)}</TableCell>
                                                <TableCell className="text-zinc-300">
                                                    {new Date(item.supply_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {status.useCustomColor ? (
                                                        <Badge className={`flex items-center gap-1 ${status.color}`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {status.label}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant={status.variant} className="flex items-center gap-1">
                                                            <StatusIcon className="h-3 w-3" />
                                                            {status.label}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
