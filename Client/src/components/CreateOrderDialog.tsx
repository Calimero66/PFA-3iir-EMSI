import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import OrderItemsEditor from "@/components/OrderItemsEditor"

// Define types based on Laravel migrations
type NewOrderLine = {
    article_id: number
    quantity: number
}



interface CreateOrderDialogProps {
    // Dialog state
    open: boolean
    onOpenChange: (open: boolean) => void

    // Form data
    orderLines: NewOrderLine[]
    paymentStatus: string
    notes: string
    orderTotal: number

    // Form handlers
    setPaymentStatus: (status: string) => void
    setNotes: (notes: string) => void
    addOrderLine: () => void
    removeOrderLine: (index: number) => void
    updateOrderLine: (index: number, field: string, value: string | number) => void
    onTotalChange: (total: number) => void

    // Utility functions
    formatPrice: (price: number) => string

    // Actions
    onCreateOrder: () => void
    onCancel: () => void
}

export default function CreateOrderDialog({
    open,
    onOpenChange,
    orderLines,
    paymentStatus,
    notes,
    orderTotal,
    setPaymentStatus,
    setNotes,
    addOrderLine,
    removeOrderLine,
    updateOrderLine,
    onTotalChange,
    formatPrice,
    onCreateOrder,
    onCancel,
}: CreateOrderDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-neutral-900 text-white hover:bg-purple-600 transition-colors">
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
                        <OrderItemsEditor
                            orderItems={orderLines}
                            onAddItem={addOrderLine}
                            onRemoveItem={removeOrderLine}
                            onUpdateItem={updateOrderLine}
                            formatPrice={formatPrice}
                            onTotalChange={onTotalChange}
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
                            <div>
                                <Label htmlFor="notes" className="mb-2 block text-white">
                                    Notes (Optional)
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes about this order..."
                                    className="w-full bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-zinc-400 font-medium">Total:</div>
                            <div className="text-xl font-bold text-white">{formatPrice(orderTotal)}</div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="text-black">
                                Cancel
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 transition-colors" onClick={onCreateOrder}>
                                Create Order
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
