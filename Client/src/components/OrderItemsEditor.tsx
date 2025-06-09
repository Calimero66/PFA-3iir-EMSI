"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import api from "@/lib/api"

interface Article {
    id: number
    name: string
    price: number
}

interface OrderItemsEditorProps {
    orderItems: { article_id: number; quantity: number }[]  // Updated to match migration
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    onUpdateItem: (index: number, field: string, value: string | number) => void
    formatPrice: (price: number) => string
    onTotalChange?: (total: number) => void  // Callback to notify parent of total changes
}

export default function OrderItemsEditor({
    orderItems,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    formatPrice,
    onTotalChange,
}: OrderItemsEditorProps) {
    // State for articles
    const [articles, setArticles] = useState<Article[]>([])
    const [articlesLoading, setArticlesLoading] = useState(false)

    // Fetch articles from API when component mounts
    useEffect(() => {
        fetchArticles()
    }, [])

    // Calculate and notify parent of total changes
    useEffect(() => {
        if (onTotalChange && articles.length > 0) {
            const total = orderItems.reduce((sum, item) => {
                const price = getArticlePrice(item.article_id)
                return sum + (price * item.quantity)
            }, 0)
            onTotalChange(total)
        }
    }, [orderItems, articles, onTotalChange])

    const fetchArticles = async () => {
        setArticlesLoading(true)
        try {
            const response = await api.get("/stock-supplies")

            // Handle the new API structure
            const articlesData = response?.data?.data || response?.data || [];
            const mappedArticles = Array.isArray(articlesData) ? articlesData.map((item: any) => ({
                id: item.article_id || item.id, // Use article_id from the supply data
                name: item.article_name || item.article?.name || `Article ${item.article_id || item.id}`,
                price: parseFloat(item.article_price || item.article?.price || 0), // Use article_price from supply data
            })) : [];
            setArticles(mappedArticles);
        } catch (error) {
            console.error("Error fetching articles:", error)
            setArticles([])
        } finally {
            setArticlesLoading(false)
        }
    }

    // Get article price by ID
    const getArticlePrice = (articleId: number): number => {
        const article = articles.find((a) => a.id === articleId)
        return article ? article.price : 0
    }
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Label>Order Items</Label>
                <Button variant="outline" size="sm" className="h-8 bg-zinc-800 border-zinc-700 text-white" onClick={onAddItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                </Button>
            </div>

            {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_100px_30px] gap-4 items-end mb-4">
                    <div>
                        <Label htmlFor={`article-${index}`} className="mb-2 block">
                            Article
                        </Label>
                        <Select value={item.article_id.toString()} onValueChange={(value) => onUpdateItem(index, "article_id", parseInt(value))}>
                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder={articlesLoading ? "Loading articles..." : "Select article"} />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {articles.map((article) => (
                                    <SelectItem key={article.id} value={article.id.toString()}>
                                        {article.name}
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
                            value={formatPrice(getArticlePrice(item.article_id))}
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
    )
}
