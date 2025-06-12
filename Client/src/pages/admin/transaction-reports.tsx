import { useState, useEffect } from "react"
import TransactionReportsTable from "@/components/TransactionReportsTable"
import api from "@/lib/api"

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

export default function TransactionReportsPage() {
    const [reports, setReports] = useState<TransactionReport[]>([])
    const [loading, setLoading] = useState(true)

    // Sample data - replace with actual API call
    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true)
                // Replace this with your actual API call
                // const response = await api.get("/transaction-reports")
                // setReports(response.data)
                
                // Sample data for demonstration
                const sampleReports: TransactionReport[] = [
                    {
                        id: 1,
                        type: "vente",
                        dateCreation: "2024-01-15T10:30:00Z",
                        utilisateur_name: "John Doe",
                        fournisseur_name: "ABC Supplier",
                        product_name: "Milk Powder",
                        quantity: 10,
                        total: "150.00"
                    },
                    {
                        id: 2,
                        type: "supply",
                        dateCreation: "2024-01-14T14:20:00Z",
                        utilisateur_name: "Jane Smith",
                        fournisseur_name: "XYZ Supplier",
                        product_name: "Beef",
                        quantity: 5,
                        total: "75.50"
                    },
                    {
                        id: 3,
                        type: "vente",
                        dateCreation: "2024-01-13T09:15:00Z",
                        utilisateur_name: "Mike Johnson",
                        product_name: "Chicken",
                        quantity: 8,
                        total: "120.00"
                    }
                ]
                setReports(sampleReports)
            } catch (error) {
                console.error("Error fetching transaction reports:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    const handleExport = (reportId: number) => {
        const report = reports.find(r => r.id === reportId)
        if (report) {
            console.log("Exporting report:", report)
            // Implement your export logic here
            alert(`Exporting report #${reportId}`)
        }
    }

    const handleViewDetails = (report: TransactionReport) => {
        console.log("Viewing details for report:", report)
        // Implement view details logic here
        alert(`Viewing details for report #${report.id}`)
    }

    const handlePrint = (report: TransactionReport) => {
        console.log("Printing report:", report)
        // Implement print logic here
        alert(`Printing report #${report.id}`)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white">
                <div className="p-6 space-y-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-zinc-400">Loading transaction reports...</div>
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
                        <h1 className="text-2xl font-bold text-white">Transaction Reports</h1>
                        <p className="text-zinc-400">View and manage transaction reports</p>
                    </div>
                </div>

                <TransactionReportsTable
                    reports={reports}
                    onExport={handleExport}
                    onViewDetails={handleViewDetails}
                    onPrint={handlePrint}
                    formatDate={formatDate}
                />
            </div>
        </div>
    )
}
