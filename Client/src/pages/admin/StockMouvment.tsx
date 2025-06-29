import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar, Filter, RefreshCw } from "lucide-react"
import StockMovementsTable from "@/components/stockMovementsTable"
import api from "@/lib/api"

// API Response Types
interface ApiStockMovement {
    id: number
    article_id: number
    type: "in" | "out"
    quantity: number
    date: string
    reason: string
    reasonAttachment?: string
    created_at: string
    updated_at: string
    article?: {
        id: number
        name: string
        barcode: string
        price: string
    }
}



const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }
    return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(date)
}

export default function StockMovementsPage() {
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
    const [movements, setMovements] = useState<ApiStockMovement[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch stock movements from API
    const fetchStockMovements = async () => {
        try {
            setLoading(true)
            console.log('Fetching stock movements from API...')
            const response = await api.get("/stock-movements")
            console.log('Stock movements API response:', response.data)

            if (response.data?.data) {
                setMovements(response.data.data)
            } else {
                console.warn('No data found in stock movements response')
                setMovements([])
            }
        } catch (error) {
            console.error("Error fetching stock movements:", error)
            setMovements([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStockMovements()
    }, [])

    // Filter movements based on selected type and date
    const filteredMovements = movements.filter((movement) => {
        const typeMatch = typeFilter === "all" || movement.type === typeFilter

        if (!dateFilter) return typeMatch

        // Get the movement date and selected date in YYYY-MM-DD format
        const movementDate = new Date(movement.date)
        const selectedDateStr = dateFilter.toISOString().split("T")[0]
        const movementDateStr = movementDate.toISOString().split("T")[0]

        const dateMatch = movementDateStr === selectedDateStr
        return typeMatch && dateMatch
    })

    const formatDateForTable = (dateString: string) => {
        return formatDate(new Date(dateString))
    }

    const handleViewAttachment = (attachmentUrl: string) => {
        // Open attachment in new tab or handle as needed
        window.open(attachmentUrl, "_blank")
    }

    const clearFilters = () => {
        setTypeFilter("all")
        setDateFilter(undefined)
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Stock Movements</h1>
                <p className="text-zinc-400">Track and monitor all stock movements</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Card className="bg-zinc-900 border-zinc-800 w-full md:w-auto">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Type</span>
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="in">Stock In</SelectItem>
                                    <SelectItem value="out">Stock Out</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 w-full md:w-auto">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Date</span>
                            </div>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={dateFilter ? dateFilter.toISOString().split("T")[0] : ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setDateFilter(new Date(e.target.value))
                                        } else {
                                            setDateFilter(undefined)
                                        }
                                    }}
                                    className="w-[180px] bg-zinc-800 border-zinc-700 text-white focus:ring-purple-600 focus:border-purple-600"
                                />
                            </div>
                            {(typeFilter !== "all" || dateFilter) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Button
                    variant="outline"
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    onClick={fetchStockMovements}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-zinc-400">Loading Stock Movements...</div>
                </div>
            ) : (
                <StockMovementsTable
                    movements={filteredMovements.map((movement) => ({
                        id: movement.id,
                        type: movement.type,
                        quantity: movement.quantity,
                        date: movement.date,
                        article_name: movement.article?.name || "Unknown Article",
                        reason: movement.reason,
                        reasonAttachment: movement.reasonAttachment,
                    }))}
                    onViewAttachment={handleViewAttachment}
                    formatDate={formatDateForTable}
                />
            )}

            {/* Summary Stats */}
            {!loading && movements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{filteredMovements.length}</div>
                                <div className="text-sm text-zinc-400">Total Movements</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-500">
                                    {filteredMovements.filter((m) => m.type === "in").length}
                                </div>
                                <div className="text-sm text-zinc-400">Stock In</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-500">
                                    {filteredMovements.filter((m) => m.type === "out").length}
                                </div>
                                <div className="text-sm text-zinc-400">Stock Out</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}