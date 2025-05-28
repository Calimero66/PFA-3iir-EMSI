import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"

interface Product {
    id: string
    name: string
    price: number
}

interface OrderItemsEditorProps {
    products: Product[]
    orderItems: { productId: string; quantity: number }[]
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    onUpdateItem: (index: number, field: string, value: string | number) => void
    getProductPrice: (productId: string) => number
    formatPrice: (price: number) => string
}

export default function OrderItemsEditor({
    products,
    orderItems,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    getProductPrice,
    formatPrice,
}: OrderItemsEditorProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Label>Order Items</Label>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-zinc-800 border-zinc-700 text-white"
                    onClick={onAddItem}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                </Button>
            </div>

            {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_100px_30px] gap-4 items-end mb-4">
                    <div>
                        <Label htmlFor={`product-${index}`} className="mb-2 block">
                            Product
                        </Label>
                        <Select
                            value={item.productId}
                            onValueChange={(value) => onUpdateItem(index, "productId", value)}
                        >
                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor={`quantity-${index}`} className="mb-2 block">
                            Qty
                        </Label>
                        <Input
                            id={`quantity-${index}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) => onUpdateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                            min="1"
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>
                    <div>
                        <Label htmlFor={`price-${index}`} className="mb-2 block">
                            Price
                        </Label>
                        <Input
                            id={`price-${index}`}
                            value={formatPrice(getProductPrice(item.productId))}
                            readOnly
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>
                    <div className="flex items-end">
                        {orderItems.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-zinc-400"
                                onClick={() => onRemoveItem(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}