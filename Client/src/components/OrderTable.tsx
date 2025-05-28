"use client"

import { Download, MoreHorizontal, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type OrderItem = {
    name: string
    quantity: number
    price: string
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

interface OrderTableProps {
    orders: Order[]
    onViewOrder: (order: Order) => void
    onCancelOrder: (order: Order) => void
    formatDate: (date: Date) => string
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

export default function OrderTable({ orders, onViewOrder, onCancelOrder, formatDate }: OrderTableProps) {
    return (
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
                        {orders.map((order) => (
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
                                            onClick={() => onViewOrder(order)}
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
                                                    onClick={() => console.log("Export clicked for order:", order.id)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-500" onClick={() => onCancelOrder(order)}>
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
    )
}
