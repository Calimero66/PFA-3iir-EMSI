import { useState, useEffect } from "react"
import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"

import api from "@/lib/api"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import OrderTable from "@/components/OrderTable"
import CreateOrderDialog from "@/components/CreateOrderDialog"
import { exportOrderToPDF, exportOrderToHTML } from "@/utils/exportOrderPDF"

// Types based on API response structure
type ItemBreakdown = {
    article_name: string
    quantity: number
    unit_price: string
    line_total: string
}

type Order = {
    order_id: number
    user: string
    total_amount: string
    total_items: number
    number_of_different_articles: number
    created_at: string
    items_breakdown: ItemBreakdown[]
    cancelled?: boolean
}

// Empty initial data for testing with real API
const initialOrders: Order[] = []

// Helper function to format dates
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

// Helper function to format date to YYYY-MM-DD for comparison
const formatDateForComparison = (date: Date) => {
    return date.toISOString().split("T")[0]
}

// Define a type for new order form items (based on Laravel migration)
type NewOrderLine = {
    article_id: number
    quantity: number
}

export default function CommandesPage() {
    // State for orders
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [orderDialogOpen, setOrderDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false)
    const [cancelOrderDialogOpen, setCancelOrderDialogOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

    // State for new order form
    const [orderLines, setOrderLines] = useState<NewOrderLine[]>([{ article_id: 0, quantity: 1 }])
    const [paymentStatus, setPaymentStatus] = useState("Pending")
    const [notes, setNotes] = useState("")
    const [orderTotal, setOrderTotal] = useState(0)

    // Fetch orders from API on component mount
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get("/orders/lines")
                if (response.data && response.data.data) {
                    setOrders(response.data.data)
                }
            } catch (error) {
                console.error("Error fetching orders:", error)
            }
        }

        fetchOrders()
    }, [])

    // Filter orders based on selected date
    const filteredOrders = orders.filter((order) => {
        const dateMatch = !date || formatDateForComparison(new Date(order.created_at)) === formatDateForComparison(date)
        return dateMatch && !order.cancelled
    })

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order)
        setOrderDialogOpen(true)
    }



    const handleDeleteOrder = (order: Order) => {
        setOrderToCancel(order)
        setCancelOrderDialogOpen(true)
    }



    const confirmCancelOrder = async () => {
        if (orderToCancel) {
            try {
                console.log('Starting order deletion process for order:', orderToCancel.order_id)
                console.log('Order items to restore:', orderToCancel.items_breakdown)

                // Step 1: Restore stock quantities for each item in the order
                let stockRestorationSuccess = true

                for (const item of orderToCancel.items_breakdown) {
                    try {
                        console.log(`Processing item: ${item.article_name}, quantity: ${item.quantity}`)

                        // Find the article in stock supplies and restore quantity
                        const stockResponse = await api.get("/stock-supplies")
                        console.log('Stock supplies response:', stockResponse.data)

                        const stockSupplies = stockResponse.data?.data || stockResponse.data || []

                        // Find the stock supply record for this article
                        const stockItem = stockSupplies.find((supply: any) => {
                            const supplyName = supply.article_name || supply.article?.name || supply.name
                            console.log(`Comparing: "${supplyName}" with "${item.article_name}"`)
                            return supplyName === item.article_name
                        })

                        if (stockItem) {
                            console.log('Found stock item:', stockItem)

                            // Calculate new quantity (restore the ordered quantity back to stock)
                            const currentQuantity = parseInt(stockItem.quantity) || 0
                            const restoreQuantity = parseInt(item.quantity.toString()) || 0
                            const newQuantity = currentQuantity + restoreQuantity

                            console.log(`Restoring stock: ${currentQuantity} + ${restoreQuantity} = ${newQuantity}`)

                            // Update the stock supply quantity
                            const updateData = {
                                quantity: newQuantity,
                                notes: `Quantity restored from deleted order #${orderToCancel.order_id}`
                            }

                            console.log('Updating stock with data:', updateData)
                            const updateResponse = await api.put(`/stock-supplies/${stockItem.id}`, updateData)
                            console.log('Stock update response:', updateResponse.data)

                            console.log(`✅ Restored ${restoreQuantity} units of ${item.article_name} to stock`)
                        } else {
                            console.warn(`❌ Stock supply not found for article: ${item.article_name}`)
                            console.log('Available stock items:', stockSupplies.map((s: any) => ({
                                id: s.id,
                                name: s.article_name || s.article?.name || s.name,
                                quantity: s.quantity
                            })))
                            stockRestorationSuccess = false
                        }
                    } catch (stockError) {
                        console.error(`❌ Error restoring stock for ${item.article_name}:`, stockError)
                        stockRestorationSuccess = false
                        // Continue with other items even if one fails
                    }
                }

                // Step 2: Delete the order lines from backend
                console.log('Deleting order lines from backend...')
                try {
                    const deleteResponse = await api.delete(`/order-lines/order/${orderToCancel.order_id}`)
                    console.log('✅ Order lines deleted successfully:', deleteResponse.data)
                } catch (deleteError: any) {
                    console.error('❌ Error deleting order lines:', deleteError)
                    throw new Error(`Failed to delete order lines: ${deleteError?.message || 'Unknown error'}`)
                }

                // Step 3: Remove from local state
                console.log('Removing order from local state...')
                const updatedOrders = orders.filter((order) => order.order_id !== orderToCancel.order_id)
                setOrders(updatedOrders)
                setCancelOrderDialogOpen(false)
                setOrderToCancel(null)

                console.log('✅ Order deleted successfully:', orderToCancel.order_id)
                if (stockRestorationSuccess) {
                    console.log('✅ All stock quantities restored successfully')
                } else {
                    console.log('⚠️ Some stock restoration failed - check logs above for details')
                }

            } catch (error: any) {
                console.error('❌ Error in order deletion process:', error)
                console.error('Error details:', {
                    message: error?.message,
                    response: error?.response?.data,
                    status: error?.response?.status
                })
                alert(`Failed to delete order. Error: ${error?.message || 'Unknown error'}. Check console for details.`)
            }
        }
    }

    const addOrderLine = () => {
        setOrderLines([...orderLines, { article_id: 0, quantity: 1 }])
    }

    const removeOrderLine = (index: number) => {
        if (orderLines.length > 1) {
            const newLines = [...orderLines]
            newLines.splice(index, 1)
            setOrderLines(newLines)
        }
    }

    const updateOrderLine = (index: number, field: string, value: string | number) => {
        const newLines = [...orderLines]
        newLines[index] = { ...newLines[index], [field]: value }
        setOrderLines(newLines)
    }

    // Handle total changes from OrderItemsEditor
    const handleTotalChange = (total: number) => {
        setOrderTotal(total)
    }

    // Handle export with fallback options
    const handleExportOrder = (order: Order) => {
        try {
            console.log('Attempting to export order:', order.order_id)
            exportOrderToPDF(order)
        } catch (error) {
            console.error('PDF export failed, trying HTML export:', error)
            exportOrderToHTML(order)
        }
    }

    // Format price as string
    const formatPrice = (price: number): string => {
        return `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const handleCreateOrder = async () => {
        if (orderLines.some((line) => !line.article_id)) {
            return
        }

        try {
            // Prepare data in the format expected by the API
            const orderData = {
                items: orderLines.map((line) => ({
                    article_id: line.article_id,
                    quantity: line.quantity,
                })),
                notes: notes || "Order created from admin panel",
            }

            // Send POST request to create order
            const response = await api.post("/orders", orderData)

            // If successful, refresh the orders list
            if (response.data) {
                // Refresh orders from API to get the latest data
                const ordersResponse = await api.get("/orders/lines")
                if (ordersResponse.data && ordersResponse.data.data) {
                    setOrders(ordersResponse.data.data)
                }

                // Reset form and close dialog
                resetOrderForm()
                setNewOrderDialogOpen(false)
            }
        } catch (error) {
            console.error("Error creating order:", error)
            // You might want to show an error message to the user here
            alert("Failed to create order. Please try again.")
        }
    }

    const resetOrderForm = () => {
        setOrderLines([{ article_id: 0, quantity: 1 }])
        setPaymentStatus("Pending")
        setNotes("")
        setOrderTotal(0)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-zinc-400">Manage customer orders</p>
                </div>
                <CreateOrderDialog
                    open={newOrderDialogOpen}
                    onOpenChange={(open) => {
                        setNewOrderDialogOpen(open)
                        if (!open) resetOrderForm()
                    }}
                    orderLines={orderLines}
                    paymentStatus={paymentStatus}
                    notes={notes}
                    orderTotal={orderTotal}
                    setPaymentStatus={setPaymentStatus}
                    setNotes={setNotes}
                    addOrderLine={addOrderLine}
                    removeOrderLine={removeOrderLine}
                    updateOrderLine={updateOrderLine}
                    onTotalChange={handleTotalChange}
                    formatPrice={formatPrice}
                    onCreateOrder={handleCreateOrder}
                    onCancel={() => setNewOrderDialogOpen(false)}
                />
            </div>

            <div className="flex flex-wrap gap-4">
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
                                        className="w-[180px] justify-start text-left font-normal bg-zinc-800 border-zinc-700"
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors" onClick={() => setDate(undefined)}>
                                    <span className="sr-only">Clear date</span>
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <OrderTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onDeleteOrder={handleDeleteOrder}
                onExportOrder={handleExportOrder}
                formatDate={formatDate}
            />

            {/* Order Details Dialog */}
            <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Order Details</h2>
                    </div>
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Order Information</h3>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Order ID:</span>
                                            <span className="text-white">{selectedOrder.order_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Date:</span>
                                            <span className="text-white">{formatDate(new Date(selectedOrder.created_at))}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Total Amount:</span>
                                            <span className="text-white">
                                                ${parseFloat(selectedOrder.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">User Information</h3>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">User:</span>
                                            <span className="text-white">{selectedOrder.user}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Total Items:</span>
                                            <span className="text-white">{selectedOrder.total_items} items</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Different Articles:</span>
                                            <span className="text-white">{selectedOrder.number_of_different_articles} articles</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 mb-2">Order Lines</h3>
                                <div className="border rounded-md border-zinc-800">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-zinc-800">
                                                    <th className="text-left p-3 text-zinc-400 font-medium">Article</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Quantity</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Unit Price</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items_breakdown.map((line, index) => (
                                                    <tr key={index} className="border-b border-zinc-800">
                                                        <td className="p-3 text-white">{line.article_name}</td>
                                                        <td className="p-3 text-right text-white">{line.quantity}</td>
                                                        <td className="p-3 text-right text-white">
                                                            ${parseFloat(line.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-3 text-right text-white">
                                                            ${parseFloat(line.line_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-b border-zinc-800 font-medium">
                                                    <td colSpan={3} className="p-3 text-right text-white">
                                                        Total:
                                                    </td>
                                                    <td className="p-3 text-right text-white">
                                                        ${parseFloat(selectedOrder.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setOrderDialogOpen(false)} className="text-black transition-colors">
                                    Close
                                </Button>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 transition-colors"
                                    onClick={() => handleExportOrder(selectedOrder)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Report
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Order Confirmation Dialog */}
            <AlertDialog open={cancelOrderDialogOpen} onOpenChange={setCancelOrderDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Order & Restore Stock</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete this order? This will:
                            <br />• Permanently remove the order from the system
                            <br />• Restore all ordered quantities back to stock supplies
                            <br />• This action cannot be undone
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmCancelOrder}>
                            Yes, delete & restore stock
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
