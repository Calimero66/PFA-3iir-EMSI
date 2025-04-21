import { useState } from "react"
import { Calendar, Download, Filter, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const reports = [
    {
        id: 1,
        type: "vente",
        dateCreation: new Date("2023-04-15T10:30:00"),
        utilisateur_id: 2,
        utilisateur_name: "Jane Smith",
        mouvement_stock_id: 101,
        fournisseur_id: null,
        fournisseur_name: null,
        ligne_commande_id: 1001,
        product_name: "Laptop Computers",
        quantity: 2,
        total: "$2,599.98",
    },
    {
        id: 2,
        type: "approvisionnement",
        dateCreation: new Date("2023-04-10T14:45:00"),
        utilisateur_id: 1,
        utilisateur_name: "John Doe",
        mouvement_stock_id: 102,
        fournisseur_id: 3,
        fournisseur_name: "TechWorld Inc.",
        ligne_commande_id: null,
        product_name: "Printer Ink",
        quantity: 50,
        total: "$4,499.50",
    },
    {
        id: 3,
        type: "vente",
        dateCreation: new Date("2023-04-08T09:15:00"),
        utilisateur_id: 2,
        utilisateur_name: "Jane Smith",
        mouvement_stock_id: 103,
        fournisseur_id: null,
        fournisseur_name: null,
        ligne_commande_id: 1002,
        product_name: "Office Chairs",
        quantity: 5,
        total: "$1,249.95",
    },
    {
        id: 4,
        type: "approvisionnement",
        dateCreation: new Date("2023-04-05T11:20:00"),
        utilisateur_id: 1,
        utilisateur_name: "John Doe",
        mouvement_stock_id: 104,
        fournisseur_id: 4,
        fournisseur_name: "Office Essentials",
        ligne_commande_id: null,
        product_name: "Office Chairs",
        quantity: 20,
        total: "$4,999.80",
    },
    {
        id: 5,
        type: "vente",
        dateCreation: new Date("2023-04-03T16:30:00"),
        utilisateur_id: 3,
        utilisateur_name: "Mike Johnson",
        mouvement_stock_id: 105,
        fournisseur_id: null,
        fournisseur_name: null,
        ligne_commande_id: 1003,
        product_name: "Laptop Computers",
        quantity: 1,
        total: "$1,299.99",
    },
]

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

const formatDateForComparison = (date: Date) => {
    return date.toISOString().split("T")[0]
}

export default function ReportsPage() {
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [date, setDate] = useState<Date | undefined>(undefined)

    // Filter reports based on selected type and date
    const filteredReports = reports.filter((report) => {
        const typeMatch = typeFilter === "all" || report.type === typeFilter
        const dateMatch = !date || formatDateForComparison(report.dateCreation) === formatDateForComparison(date)
        return typeMatch && dateMatch
    })

    const handleExport = (reportId: number) => {
        console.log(`Exporting report ${reportId}`)
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <p className="text-zinc-400">View and analyze transaction reports</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <Card className="bg-zinc-900 border-zinc-800 w-full md:w-auto">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Type:</span>
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="vente">Sale</SelectItem>
                                    <SelectItem value="approvisionnement">Supply</SelectItem>
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
                                <span className="text-sm text-zinc-400">Date:</span>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-[180px] justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white"
                                    >
                                        {date ? formatDate(date, { hour: undefined, minute: undefined }) : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700">
                                    <CalendarComponent
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        className="bg-zinc-800"
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(undefined)}>
                                    <span className="sr-only">Clear date</span>
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Transaction Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800">
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map((report) => (
                                <TableRow key={report.id} className="border-zinc-800">
                                    <TableCell>{report.id}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${report.type === "vente" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
                                                }`}
                                        >
                                            {report.type === "vente" ? "Sale" : "Supply"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{formatDate(report.dateCreation)}</TableCell>
                                    <TableCell>{report.utilisateur_name}</TableCell>
                                    <TableCell>{report.fournisseur_name || "-"}</TableCell>
                                    <TableCell>{report.product_name}</TableCell>
                                    <TableCell>{report.quantity}</TableCell>
                                    <TableCell>{report.total}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
                                                onClick={() => handleExport(report.id)}
                                            >
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Export report {report.id}</span>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                                    <DropdownMenuItem className="cursor-pointer">View details</DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer">Print</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
