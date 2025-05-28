import { useState } from "react"
import { Calendar, Download, MoreHorizontal, Plus, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

// Get payment status color
const getPaymentStatusColor = (status: string) => {
    switch (status) {
        case "Paid":
            return "bg-green-500/20 text-green-500"
        case "Pending":
            return "bg-yellow-500/20 text-yellow-500"
        case "Refunded":
            return "bg-red-500/20 text-red-500"
        default:
            return "bg-zinc-500/20 text-zinc-400"
    }
}

// Define a type for new order form items
type NewOrderItem = {
    productId: string
    quantity: number
}

// Helper to find customer ID by name
const findCustomerIdByName = (name: string): string => {
    const customer = customers.find((c) => c.name === name)
    return customer ? customer.id : ""
}

// Helper to find agent ID by name
const findAgentIdByName = (name: string): string => {
    const agent = agents.find((a) => a.name === name)
    return agent ? agent.id : ""
}

// Helper to find product ID by name
const findProductIdByName = (name: string): string => {
    const product = products.find((p) => p.name === name)
    return product ? product.id : ""
}

export default function CommandesPage() {
    // State for orders
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [orderDialogOpen, setOrderDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false)
    const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false)
    const [cancelOrderDialogOpen, setCancelOrderDialogOpen] = useState(false)
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null)
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

    const handleEditOrder = (order: Order) => {
        setOrderToEdit(order)

        // Convert order items to form items
        const formItems = order.items.map((item) => ({
            productId: findProductIdByName(item.name),
            quantity: item.quantity,
        }))

        setOrderItems(formItems)
        setCustomerId(findCustomerIdByName(order.customer))
        setAgentId(findAgentIdByName(order.agent))
        setPaymentStatus(order.paymentStatus)

        setEditOrderDialogOpen(true)
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

            // Show success message
            // alert(`Order ${orderToCancel.id} has been cancelled.`)
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
        // Validate form
        // if (!customerId) {
        //   alert("Please select a customer")
        //   return
        // }

        // if (!agentId) {
        //   alert("Please select an agent")
        //   return
        // }

        // if (orderItems.some((item) => !item.productId)) {
        //   alert("Please select a product for all items")
        //   return
        // }

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

        // Show success message
        // alert(`Order ${orderId} has been created successfully.`)

        // Reset form and close dialog
        resetOrderForm()
        setNewOrderDialogOpen(false)
    }

    const handleUpdateOrder = () => {
        // Validate form
        // if (!customerId) {
        //   alert("Please select a customer")
        //   return
        // }

        // if (!agentId) {
        //   alert("Please select an agent")
        //   return
        // }

        // if (orderItems.some((item) => !item.productId)) {
        //   alert("Please select a product for all items")
        //   return
        // }

        if (!customerId || !agentId || orderItems.some((item) => !item.productId)) {
            return
        }

        if (!orderToEdit) {
            return
        }

        // Update order
        const customer = customers.find((c) => c.id === customerId)?.name || ""
        const agent = agents.find((a) => a.id === agentId)?.name || ""

        const updatedOrderItems: OrderItem[] = orderItems.map((item) => ({
            name: getProductName(item.productId),
            quantity: item.quantity,
            price: formatPrice(getProductPrice(item.productId)),
        }))

        const total = calculateTotal()

        const updatedOrder: Order = {
            ...orderToEdit,
            customer,
            items: updatedOrderItems,
            total,
            paymentStatus,
            agent,
        }

        // Update the orders state
        const updatedOrders = orders.map((order) => (order.id === orderToEdit.id ? updatedOrder : order))

        setOrders(updatedOrders)

        // Show success message
        // alert(`Order ${orderToEdit.id} has been updated successfully.`)

        // Reset form and close dialog
        resetOrderForm()
        setEditOrderDialogOpen(false)
        setOrderToEdit(null)
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

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800">
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id} className="border-zinc-800">
                                    <TableCell className="font-medium text-white">{order.id}</TableCell>
                                    <TableCell className="text-white">{formatDate(order.date)}</TableCell>
                                    <TableCell className="text-white">{order.customer}</TableCell>
                                    <TableCell className="text-white">{order.total}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-white">{order.agent}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
                                                onClick={() => handleViewOrder(order)}
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                                <span className="sr-only">View order {order.id}</span>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-white"
                                                        onClick={() => handleEditOrder(order)}
                                                    >
                                                        Edit order
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer text-white">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Export
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-500"
                                                        onClick={() => handleCancelOrder(order)}
                                                    >
                                                        Cancel order
                                                    </DropdownMenuItem>
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

            {/* Order Details Dialog */}
            <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Order Details</h2>
                        {/* <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setOrderDialogOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button> */}
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
                                            <Badge variant="outline" className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
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
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800">
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items.map((item, index) => (
                                                <TableRow key={index} className="border-zinc-800">
                                                    <TableCell className="text-white">{item.name}</TableCell>
                                                    <TableCell className="text-right text-white">{item.quantity}</TableCell>
                                                    <TableCell className="text-right text-white">{item.price}</TableCell>
                                                    <TableCell className="text-right text-white">
                                                        {`${(
                                                            Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity
                                                        ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="border-zinc-800 font-medium">
                                                <TableCell colSpan={3} className="text-right text-white">
                                                    Total:
                                                </TableCell>
                                                <TableCell className="text-right text-white">{selectedOrder.total}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
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

            {/* Edit Order Dialog */}
            <Dialog
                open={editOrderDialogOpen}
                onOpenChange={(open) => {
                    setEditOrderDialogOpen(open)
                    if (!open) {
                        resetOrderForm()
                        setOrderToEdit(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 p-0">
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Edit Order</h2>
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
                                <Button variant="outline" onClick={() => setEditOrderDialogOpen(false)} className="text-black">
                                    Cancel
                                </Button>
                                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleUpdateOrder}>
                                    Update Order
                                </Button>
                            </div>
                        </div>
                    </div>
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

