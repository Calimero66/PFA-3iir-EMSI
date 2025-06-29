import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { exportOrderToPDF, exportOrderToHTML } from "@/utils/exportOrderPDF"
import api from "@/lib/api"
import { toast, Toaster } from "sonner"

interface Order {
    order_id: number
    user: string
    total_amount: number
    payment_status: string
    created_at: string
    updated_at: string
    items_breakdown: Array<{
        article_name: string
        quantity: number
        unit_price: number
        line_total: number
    }>
    notes?: string
}

export default function OrderDownload() {
    const { id, format } = useParams<{ id: string; format: string }>()
    const navigate = useNavigate()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchOrder(parseInt(id))
        } else {
            setError("Invalid order ID")
            setLoading(false)
        }
    }, [id])

    const fetchOrder = async (orderId: number) => {
        try {
            setLoading(true)
            const response = await api.get(`/orders/lines/${orderId}`)
            
            if (response.data && response.data.data) {
                setOrder(response.data.data)
                // Auto-download if format is specified
                if (format === 'pdf') {
                    setTimeout(() => {
                        handleDownload(response.data.data)
                    }, 1000) // Small delay to show the page
                }
            } else {
                setError("Order not found")
            }
        } catch (error: any) {
            console.error("Error fetching order:", error)
            if (error.response?.status === 404) {
                setError("Order not found")
            } else {
                setError("Failed to load order. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (orderData?: Order) => {
        const targetOrder = orderData || order
        if (!targetOrder) {
            toast.error("No order data available")
            return
        }

        setDownloading(true)
        try {
            console.log('Starting download for order:', targetOrder.order_id)
            
            if (format === 'pdf' || !format) {
                exportOrderToPDF(targetOrder)
                toast.success("PDF download started", {
                    description: `Downloading Order #${targetOrder.order_id} report`,
                    duration: 3000,
                })
            } else {
                exportOrderToHTML(targetOrder)
                toast.success("HTML export opened", {
                    description: `Opening Order #${targetOrder.order_id} report`,
                    duration: 3000,
                })
            }
        } catch (error) {
            console.error('Download failed:', error)
            toast.error("Download failed", {
                description: "Please try again or contact support",
                duration: 5000,
            })
        } finally {
            setDownloading(false)
        }
    }

    const handleGoBack = () => {
        navigate('/Orders')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
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
                <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading order...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
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
                <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Download Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-zinc-400">{error}</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleGoBack}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go Back
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
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
            <Card className="bg-zinc-900 border-zinc-800 w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        Order Download
                    </CardTitle>
                    <p className="text-zinc-400">Ready to download order report</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {order && (
                        <div className="space-y-4">
                            <div className="bg-zinc-800 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-white">Order #{order.order_id}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-zinc-400">User:</span>
                                        <span className="text-white ml-2">{order.user}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Total:</span>
                                        <span className="text-white ml-2">${order.total_amount}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Status:</span>
                                        <span className="text-white ml-2">{order.payment_status}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Items:</span>
                                        <span className="text-white ml-2">{order.items_breakdown?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleDownload()}
                                    disabled={downloading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {downloading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleGoBack}
                                    variant="outline"
                                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </div>

                            <div className="text-xs text-zinc-500 text-center">
                                <p>This page was accessed via QR code scan</p>
                                <p>The download should start automatically</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
