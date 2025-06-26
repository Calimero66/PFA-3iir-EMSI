import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Types for the transaction report
type TransactionReport = {
    id: number
    type: "vente" | "supply"
    dateCreation: string
    utilisateur_name: string
    fournisseur_name?: string
    product_name: string
    quantity: number
    total: string | number
}

interface TransactionReportsTableProps {
    reports: TransactionReport[]
    onExport: (reportId: number) => void
    formatDate: (date: string) => string
}

export default function TransactionReportsTable({
    reports,
    onExport,
    formatDate
}: TransactionReportsTableProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white">Transaction Movements Stocks</CardTitle>
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
                            {/* <TableHead>Actions</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id} className="border-zinc-800">
                                <TableCell className="text-white">{report.id}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            report.type === "vente" 
                                                ? "bg-green-500/20 text-green-500" 
                                                : "bg-blue-500/20 text-blue-500"
                                        }`}
                                    >
                                        {report.type === "vente" ? "Sale" : "Supply"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-white">{formatDate(report.dateCreation)}</TableCell>
                                <TableCell className="text-white">{report.utilisateur_name}</TableCell>
                                <TableCell className="text-white">{report.fournisseur_name || "-"}</TableCell>
                                <TableCell className="text-white">{report.product_name}</TableCell>
                                <TableCell className="text-white">{report.quantity}</TableCell>
                                <TableCell className="text-white">{report.total}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                        onClick={() => onExport(report.id)}
                                        title="Export Report"
                                    >
                                        {/* <Download className="h-4 w-4" /> */}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
