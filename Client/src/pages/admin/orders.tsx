import { useState } from "react"
import { Calendar, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import OrderItemsEditor from "@/components/OrderItemsEditor"
import OrderTable from "@/components/OrderTable"

// Define types
type OrderItem = {
    name: string
    quantity: number
    price: string
}

type Product = {
    id: string
    name: string
    price: number
}

type Order = {
    id: string
    date: Date
    customer: string
    items: OrderItem[]
    total: string
    paymentStatus: string
    agent: string
    cancelled?: boolean
}

// Sample data for orders
const initialOrders: Order[] = [
    {
        id: "ORD-2023-001",
        date: new Date("2023-04-15T10:30:00"),
        customer: "Acme Corporation",
        items: [
            { name: "Laptop Computers", quantity: 5, price: "$1,299.99" },
            { name: "Office Chairs", quantity: 10, price: "$249.99" },
        ],
        total: "$8,999.85",
        paymentStatus: "Paid",
        agent: "Jane Smith",
    },
    {
        id: "ORD-2023-002",
        date: new Date("2023-04-12T14:45:00"),
        customer: "TechStart Inc.",
        items: [
            { name: "Printer Ink", quantity: 20, price: "$89.99" },
            { name: "Office Chairs", quantity: 5, price: "$249.99" },
        ],
        total: "$3,049.75",
        paymentStatus: "Pending",
        agent: "John Doe",
    },
    {
        id: "ORD-2023-003",
        date: new Date("2023-04-10T09:15:00"),
        customer: "Global Solutions",
        items: [{ name: "Laptop Computers", quantity: 3, price: "$1,299.99" }],
        total: "$3,899.97",
        paymentStatus: "Paid",
        agent: "Mike Johnson",
    },
    {
        id: "ORD-2023-004",
        date: new Date("2023-04-08T11:20:00"),
        customer: "Local Business Ltd.",
        items: [
            { name: "Office Chairs", quantity: 15, price: "$249.99" },
            { name: "Desk Lamps", quantity: 15, price: "$79.99" },
        ],
        total: "$4,949.70",
        paymentStatus: "Paid",
        agent: "Jane Smith",
    },
    {
        id: "ORD-2023-005",
        date: new Date("2023-04-05T16:30:00"),
        customer: "Education Center",
        items: [
            { name: "Laptop Computers", quantity: 10, price: "$1,299.99" },
            { name: "Printer Ink", quantity: 30, price: "$89.99" },
        ],
        total: "$15,699.60",
        paymentStatus: "Refunded",
        agent: "John Doe",
    },
]

// Product data with prices
const products = [
    { id: "laptop", name: "Laptop Computers", price: 1299.99 },
    { id: "chair", name: "Office Chairs", price: 249.99 },
    { id: "ink", name: "Printer Ink", price: 89.99 },
    { id: "lamp", name: "Desk Lamps", price: 79.99 },
]

// Customer data
const customers = [
    { id: "acme", name: "Acme Corporation" },
    { id: "techstart", name: "TechStart Inc." },
    { id: "global", name: "Global Solutions" },
    { id: "local", name: "Local Business Ltd." },
    { id: "education", name: "Education Center" },
]

// Agent data
const agents = [
    { id: "jane", name: "Jane Smith" },
    { id: "john", name: "John Doe" },
    { id: "mike", name: "Mike Johnson" },
]

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

// Define a type for new order form items
type NewOrderItem = {
    productId: string
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
    const [orderItems, setOrderItems] = useState<NewOrderItem[]>([{ productId: "", quantity: 1 }])
    const [customerId, setCustomerId] = useState("")
    const [agentId, setAgentId] = useState("")
    const [paymentStatus, setPaymentStatus] = useState("Pending")

    // Filter orders based on selected date
    const filteredOrders = orders.filter((order) => {
        const dateMatch = !date || formatDateForComparison(order.date) === formatDateForComparison(date)
        return dateMatch && !order.cancelled
    })

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order)
        setOrderDialogOpen(true)
    }

    const handleCancelOrder = (order: Order) => {
        setOrderToCancel(order)
        setCancelOrderDialogOpen(true)
    }

    const confirmCancelOrder = () => {
        if (orderToCancel) {
            const updatedOrders = orders.map((order) =>
                order.id === orderToCancel.id ? { ...order, cancelled: true, paymentStatus: "Refunded" } : order,
            )
            setOrders(updatedOrders)
            setCancelOrderDialogOpen(false)
            setOrderToCancel(null)
        }
    }

    const addOrderItem = () => {
        setOrderItems([...orderItems, { productId: "", quantity: 1 }])
    }

    const removeOrderItem = (index: number) => {
        if (orderItems.length > 1) {
            const newItems = [...orderItems]
            newItems.splice(index, 1)
            setOrderItems(newItems)
        }
    }

    const updateOrderItem = (index: number, field: string, value: string | number) => {
        const newItems = [...orderItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setOrderItems(newItems)
    }

    // Calculate the price for a product
    const getProductPrice = (productId: string): number => {
        const product = products.find((p) => p.id === productId)
        return product ? product.price : 0
    }

    // Calculate the total price for the order
    const calculateTotal = (): string => {
        const total = orderItems.reduce((sum, item) => {
            const price = getProductPrice(item.productId)
            return sum + price * item.quantity
        }, 0)

        return `${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // Get product name by ID
    const getProductName = (productId: string): string => {
        const product = products.find((p) => p.id === productId)
        return product ? product.name : ""
    }

    // Format price as string
    const formatPrice = (price: number): string => {
        return `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const handleCreateOrder = () => {
        if (!customerId || !agentId || orderItems.some((item) => !item.productId)) {
            return
        }

        // Create new order
        const customer = customers.find((c) => c.id === customerId)?.name || ""
        const agent = agents.find((a) => a.id === agentId)?.name || ""

        const newOrderItems: OrderItem[] = orderItems.map((item) => ({
            name: getProductName(item.productId),
            quantity: item.quantity,
            price: formatPrice(getProductPrice(item.productId)),
        }))

        const total = calculateTotal()

        // Generate a new order ID
        const orderId = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`

        const newOrder: Order = {
            id: orderId,
            date: new Date(),
            customer,
            items: newOrderItems,
            total,
            paymentStatus,
            agent,
        }

        // Add the new order to the orders state
        setOrders([newOrder, ...orders])

        // Reset form and close dialog
        resetOrderForm()
        setNewOrderDialogOpen(false)
    }

    const resetOrderForm = () => {
        setOrderItems([{ productId: "", quantity: 1 }])
        setCustomerId("")
        setAgentId("")
        setPaymentStatus("Pending")
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-zinc-400">Manage customer orders</p>
                </div>
                <Dialog
                    open={newOrderDialogOpen}
                    onOpenChange={(open) => {
                        setNewOrderDialogOpen(open)
                        if (!open) resetOrderForm()
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            New Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 p-0">
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white">Create New Order</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="customer" className="mb-2 block text-white">
                                            Customer
                                        </Label>
                                        <Select value={customerId} onValueChange={setCustomerId}>
                                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="agent" className="mb-2 block text-white">
                                            Agent
                                        </Label>
                                        <Select value={agentId} onValueChange={setAgentId}>
                                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                                <SelectValue placeholder="Select agent" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id}>
                                                        {agent.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <OrderItemsEditor
                                    products={products}
                                    orderItems={orderItems}
                                    onAddItem={addOrderItem}
                                    onRemoveItem={removeOrderItem}
                                    onUpdateItem={updateOrderItem}
                                    getProductPrice={getProductPrice}
                                    formatPrice={formatPrice}
                                />

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <Label htmlFor="payment" className="mb-2 block text-white">
                                            Payment Status
                                        </Label>
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                                <SelectValue placeholder="Pending" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                                <SelectItem value="Refunded">Refunded</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="text-zinc-400 font-medium">Total:</div>
                                    <div className="text-xl font-bold text-white">{calculateTotal()}</div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setNewOrderDialogOpen(false)} className="text-black">
                                        Cancel
                                    </Button>
                                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateOrder}>
                                        Create Order
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(undefined)}>
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
                onCancelOrder={handleCancelOrder}
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
                                            <span className="text-white">{selectedOrder.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Date:</span>
                                            <span className="text-white">{formatDate(selectedOrder.date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Status:</span>
                                            <Badge
                                                variant="outline"
                                                className={`px-2 py-1 rounded-full text-xs ${selectedOrder.paymentStatus === "Paid"
                                                        ? "bg-green-500/20 text-green-500"
                                                        : selectedOrder.paymentStatus === "Pending"
                                                            ? "bg-yellow-500/20 text-yellow-500"
                                                            : selectedOrder.paymentStatus === "Refunded"
                                                                ? "bg-red-500/20 text-red-500"
                                                                : "bg-zinc-500/20 text-zinc-400"
                                                    }`}
                                            >
                                                {selectedOrder.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Customer Information</h3>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Customer:</span>
                                            <span className="text-white">{selectedOrder.customer}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Agent:</span>
                                            <span className="text-white">{selectedOrder.agent}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 mb-2">Order Items</h3>
                                <div className="border rounded-md border-zinc-800">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-zinc-800">
                                                    <th className="text-left p-3 text-zinc-400 font-medium">Item</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Quantity</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Price</th>
                                                    <th className="text-right p-3 text-zinc-400 font-medium">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index} className="border-b border-zinc-800">
                                                        <td className="p-3 text-white">{item.name}</td>
                                                        <td className="p-3 text-right text-white">{item.quantity}</td>
                                                        <td className="p-3 text-right text-white">{item.price}</td>
                                                        <td className="p-3 text-right text-white">
                                                            {`${(
                                                                Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity
                                                            ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-b border-zinc-800 font-medium">
                                                    <td colSpan={3} className="p-3 text-right text-white">
                                                        Total:
                                                    </td>
                                                    <td className="p-3 text-right text-white">{selectedOrder.total}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setOrderDialogOpen(false)} className="text-black">
                                    Close
                                </Button>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cancel Order Confirmation Dialog */}
            <AlertDialog open={cancelOrderDialogOpen} onOpenChange={setCancelOrderDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Cancel Order</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to cancel this order? This action will mark the order as cancelled and cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-black">No, keep order</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmCancelOrder}>
                            Yes, cancel order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
