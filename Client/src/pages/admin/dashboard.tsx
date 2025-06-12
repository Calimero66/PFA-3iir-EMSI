import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from "@/lib/api"

// Types for API responses
type Order = {
    order_id: number
    user: string
    total_amount: string
    total_items: number
    number_of_different_articles: number
    created_at: string
    items_breakdown: {
        article_name: string
        quantity: number
        unit_price: string
        line_total: string
    }[]
    cancelled?: boolean
}

type StockItem = {
    id: number
    article_id: number
    article_name: string
    article_price: string
    category_name: string
    supplier_name: string
    quantity: number
    supply_date: string
    article: {
        id: number
        name: string
        price: string
        quantity: number
        category_id: number
        supplier_id: number
        category: {
            id: number
            name: string
        }
        supplier: {
            id: number
            name: string
        }
    }
}

type Report = {
    id: number
    type: "sale" | "supply"
    report_date: string
    user: {
        id: number
        name: string
    }
    stock_movement: {
        id: number
        article_id: number
        type: "in" | "out"
        quantity: number
        date: string
        article: {
            id: number
            name: string
            price: string
            quantity: number
        }
    }
}

// Dashboard analytics types
type SalesAnalytics = {
    totalRevenue: number
    revenueChange: number
    ordersToday: number
    ordersThisWeek: number
    ordersThisMonth: number
    salesTrend: { date: string; revenue: number }[]
}

type InventoryAnalytics = {
    totalArticles: number
    lowStockCount: number
    outOfStockCount: number
    categoryBreakdown: { name: string; value: number; color: string }[]
    topSellingArticles: { name: string; sales: number }[]
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [reports, setReports] = useState<Report[]>([])
    const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics>({
        totalRevenue: 0,
        revenueChange: 0,
        ordersToday: 0,
        ordersThisWeek: 0,
        ordersThisMonth: 0,
        salesTrend: []
    })
    const [inventoryAnalytics, setInventoryAnalytics] = useState<InventoryAnalytics>({
        totalArticles: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        categoryBreakdown: [],
        topSellingArticles: []
    })

    // Fetch all data on component mount
    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch all data in parallel
            const [ordersResponse, stockResponse, reportsResponse] = await Promise.all([
                api.get("/orders/lines"),
                api.get("/stock-supplies"),
                api.get("/reports")
            ])

            const ordersData = ordersResponse.data?.data || []
            const stockData = stockResponse.data?.data || []
            const reportsData = reportsResponse.data?.data || []

            setOrders(ordersData)
            setStockItems(stockData)
            setReports(reportsData)

            // Calculate analytics
            calculateSalesAnalytics(ordersData, reportsData)
            calculateInventoryAnalytics(stockData, reportsData)

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSalesAnalytics = (ordersData: Order[], reportsData: Report[]) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

        // Calculate total revenue from orders
        const totalRevenue = ordersData
            .filter(order => !order.cancelled)
            .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)

        // Calculate orders by time period
        const ordersToday = ordersData.filter(order =>
            !order.cancelled && new Date(order.created_at) >= today
        ).length

        const ordersThisWeek = ordersData.filter(order =>
            !order.cancelled && new Date(order.created_at) >= weekAgo
        ).length

        const ordersThisMonth = ordersData.filter(order =>
            !order.cancelled && new Date(order.created_at) >= monthAgo
        ).length

        // Calculate sales trend (last 7 days)
        const salesTrend = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

            const dayRevenue = ordersData
                .filter(order => {
                    const orderDate = new Date(order.created_at)
                    return !order.cancelled && orderDate >= dayStart && orderDate < dayEnd
                })
                .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)

            salesTrend.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: dayRevenue
            })
        }

        // Calculate revenue change (compare this week vs last week)
        const lastWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thisWeekRevenue = ordersData
            .filter(order => {
                const orderDate = new Date(order.created_at)
                return !order.cancelled && orderDate >= weekAgo
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)

        const lastWeekRevenue = ordersData
            .filter(order => {
                const orderDate = new Date(order.created_at)
                return !order.cancelled && orderDate >= lastWeekStart && orderDate < weekAgo
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)

        const revenueChange = lastWeekRevenue > 0
            ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
            : 0

        setSalesAnalytics({
            totalRevenue,
            revenueChange,
            ordersToday,
            ordersThisWeek,
            ordersThisMonth,
            salesTrend
        })
    }

    const calculateInventoryAnalytics = (stockData: StockItem[], reportsData: Report[]) => {
        const totalArticles = stockData.length
        const lowStockThreshold = 10
        const lowStockCount = stockData.filter(item => item.quantity <= lowStockThreshold && item.quantity > 0).length
        const outOfStockCount = stockData.filter(item => item.quantity === 0).length

        // Calculate category breakdown
        const categoryMap = new Map<string, number>()
        stockData.forEach(item => {
            const categoryName = item.category_name || 'Uncategorized'
            categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
        })

        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899']
        const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }))

        // Calculate top selling articles from reports
        const articleSalesMap = new Map<string, number>()
        reportsData
            .filter(report => report.stock_movement.type === 'out') // Sales only
            .forEach(report => {
                const articleName = report.stock_movement.article.name
                const quantity = report.stock_movement.quantity
                articleSalesMap.set(articleName, (articleSalesMap.get(articleName) || 0) + quantity)
            })

        const topSellingArticles = Array.from(articleSalesMap.entries())
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)

        setInventoryAnalytics({
            totalArticles,
            lowStockCount,
            outOfStockCount,
            categoryBreakdown,
            topSellingArticles
        })
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 text-white">
                <div className="flex justify-center items-center h-64">
                    <div className="text-zinc-400">Loading dashboard...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 text-white">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-400">Business analytics and key performance indicators</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                        <div className="text-3xl font-bold">${salesAnalytics.totalRevenue.toFixed(2)}</div>
                        <div className={`flex items-center text-sm mt-1 ${salesAnalytics.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesAnalytics.revenueChange >= 0 ? (
                                <ArrowUp className="h-4 w-4 mr-1" />
                            ) : (
                                <ArrowDown className="h-4 w-4 mr-1" />
                            )}
                            <span>{Math.abs(salesAnalytics.revenueChange).toFixed(1)}%</span>
                            <span className="ml-1">vs last week</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Today */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Orders Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                        <div className="text-3xl font-bold">{salesAnalytics.ordersToday}</div>
                        <div className="text-sm text-zinc-400 mt-1">
                            {salesAnalytics.ordersThisWeek} this week • {salesAnalytics.ordersThisMonth} this month
                        </div>
                    </CardContent>
                </Card>

                {/* Total Articles */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Total Articles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                        <div className="text-3xl font-bold">{inventoryAnalytics.totalArticles}</div>
                        <div className="text-sm text-zinc-400 mt-1">
                            {inventoryAnalytics.lowStockCount} low stock • {inventoryAnalytics.outOfStockCount} out of stock
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Alerts */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                        <div className="text-3xl font-bold text-yellow-500">{inventoryAnalytics.lowStockCount}</div>
                        <div className="text-sm text-zinc-400 mt-1">
                            Items need restocking
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Chart */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Sales Trend (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesAnalytics.salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Distribution Pie Chart */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Articles by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={inventoryAnalytics.categoryBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {inventoryAnalytics.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Selling Articles */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Top Selling Articles</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={inventoryAnalytics.topSellingArticles}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                tick={{ fontSize: 12 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid #374151',
                                    borderRadius: '6px',
                                    color: '#fff'
                                }}
                                formatter={(value: any) => [`${value} units`, 'Sales']}
                            />
                            <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Stock Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">In Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {inventoryAnalytics.totalArticles - inventoryAnalytics.lowStockCount - inventoryAnalytics.outOfStockCount}
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                    width: `${((inventoryAnalytics.totalArticles - inventoryAnalytics.lowStockCount - inventoryAnalytics.outOfStockCount) / inventoryAnalytics.totalArticles) * 100}%`
                                }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Low Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{inventoryAnalytics.lowStockCount}</div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{
                                    width: `${(inventoryAnalytics.lowStockCount / inventoryAnalytics.totalArticles) * 100}%`
                                }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Out of Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{inventoryAnalytics.outOfStockCount}</div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                    width: `${(inventoryAnalytics.outOfStockCount / inventoryAnalytics.totalArticles) * 100}%`
                                }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
