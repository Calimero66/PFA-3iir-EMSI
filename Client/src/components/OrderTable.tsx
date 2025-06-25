"use client"

import { Download, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface OrderTableProps {
    orders: Order[]
    onViewOrder: (order: Order) => void
    onDeleteOrder: (order: Order) => void
    onExportOrder: (order: Order) => void
    formatDate: (date: Date) => string
    canDelete?: boolean
    userRole?: string
    getRoleColor?: (role: string) => string
}



export default function OrderTable({ orders, onViewOrder, onDeleteOrder, onExportOrder, formatDate, canDelete = true, userRole, getRoleColor }: OrderTableProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <CardTitle className="text-white">Orders</CardTitle>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-zinc-400">
                            {orders.length} {orders.length === 1 ? "order" : "orders"} found
                        </span>
                        {userRole && getRoleColor && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(userRole)}`}>
                                {userRole} • {canDelete ? 'Full Access' : 'View Only'}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800">
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Total Items</TableHead>
                            <TableHead>Different Articles</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.order_id} className="border-zinc-800">
                                <TableCell className="font-medium text-white">#{order.order_id}</TableCell>
                                <TableCell className="text-white">{formatDate(new Date(order.created_at))}</TableCell>
                                <TableCell className="text-white">{order.user}</TableCell>
                                <TableCell className="text-white">
                                    ${parseFloat(order.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-white">{order.total_items} items</TableCell>
                                <TableCell className="text-white">{order.number_of_different_articles} articles</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                            onClick={() => onViewOrder(order)}
                                            title="View Order"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                            onClick={() => onExportOrder(order)}
                                            title="Export Report"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {/* Delete button - only for Admin and Manager */}
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                onClick={() => onDeleteOrder(order)}
                                                title="Delete Order"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
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
