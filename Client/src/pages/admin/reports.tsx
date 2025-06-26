import { useState, useEffect } from "react"
import { Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TransactionReportsTable from "@/components/TransactionReportsTable"
import api from "@/lib/api"

// API Response Types
interface ApiReport {
    id: number
    type: "sale" | "supply"
    report_date: string
    user_id: number
    stock_movement_id: number
    supplier_id: number | null
    order_line_id: number | null
    details: string
    created_at: string
    updated_at: string
    user: {
        id: number
        name: string
        email: string
        role: string
    }
    stock_movement: {
        id: number
        article_id: number
        type: "in" | "out"
        quantity: number
        date: string
        reason: string
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
        }
    }
    supplier?: {
        id: number
        name: string
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



export default function ReportsPage() {
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [reports, setReports] = useState<ApiReport[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch reports from API
    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true)
                console.log('Fetching reports from API...')
                const response = await api.get("/reports")
                console.log('Reports API response:', response.data)

                if (response.data?.data) {
                    setReports(response.data.data)
                } else {
                    console.warn('No data found in reports response')
                    setReports([])
                }
            } catch (error) {
                console.error("Error fetching reports:", error)
                setReports([])
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    // Filter reports based on selected type and date
    const filteredReports = reports.filter((report) => {

        const reportType = report.stock_movement.type === "out" ? "sale" : "supply"
        const typeMatch = typeFilter === "all" || reportType === typeFilter

        if (!date) return typeMatch

        // Get the report date and selected date in YYYY-MM-DD format
        const reportDate = new Date(report.report_date)
        const selectedDateStr = date.toISOString().split('T')[0]
        const reportDateStr = reportDate.toISOString().split('T')[0]

        const dateMatch = reportDateStr === selectedDateStr
        return typeMatch && dateMatch
    })

    const formatDateForTable = (dateString: string) => {
        return formatDate(new Date(dateString))
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Movements Stocks</h1>
                <p className="text-zinc-400">View and analyze transaction Movements Stocks</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <Card className="bg-zinc-900 border-zinc-800 w-full md:w-auto">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-400">Type</span>
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="sale">Sale</SelectItem>
                                    <SelectItem value="supply">Supply</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 w-full md:w-auto">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {/* <Calendar className="h-4 w-4 text-zinc-400" /> */}
                                <span className="text-sm text-zinc-400">Date</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date ? date.toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setDate(new Date(e.target.value))
                                        } else {
                                            setDate(undefined)
                                        }
                                    }}
                                    className="w-[180px] h-9 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                                    placeholder="Pick a date"
                                />
                            </div>
                            {date && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" onClick={() => setDate(undefined)}>
                                    <span className="sr-only">Clear date</span>
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-zinc-400">Loading Stocks...</div>
                </div>
            ) : (
                <TransactionReportsTable
                    reports={filteredReports.map(report => ({
                        id: report.id,
                        type: (report.stock_movement.type === "out" ? "vente" : "supply") as "vente" | "supply",
                        dateCreation: report.report_date,
                        utilisateur_name: report.user.name,
                        fournisseur_name: report.supplier?.name,
                        product_name: report.stock_movement.article.name,
                        quantity: report.stock_movement.quantity,
                        total: `$${(parseFloat(report.stock_movement.article.price) * report.stock_movement.quantity).toFixed(2)}`
                    }))}
                    onExport={() => {}}
                    formatDate={formatDateForTable}
                />
            )}
        </div>
    )
}
