import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { 
    generateArticlePDFQRData, 
    generateArticleInfoQRData, 
    generateOrderPDFQRData, 
    generateOrderInfoQRData,
    getQRCodeTitle, 
    getQRCodeDescription,
    type QRCodeDataType 
} from "@/utils/qrCodeUtils"
import { Label } from "@/components/ui/label"
import { Info, Download } from "lucide-react"

interface ArticleItem {
    id: number
    barcode: string
    name: string
    price: number | string
    quantity: number
    category_id: number
    supplier_id: number
    user_id: number
    category: {
        id: number
        name: string
    }
    supplier: {
        id: number
        name: string
    }
    user: {
        id: number
        name: string
    }
    notes?: string
    created_at: string
    updated_at: string
}

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

interface QRCodeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: ArticleItem | Order | any | null  // Made more flexible to handle different Order types
    type: 'article' | 'order'
    defaultDataType?: 'pdf' | 'info'
}

export function QRCodeDialog({ 
    open, 
    onOpenChange, 
    item, 
    type, 
    defaultDataType = 'pdf' 
}: QRCodeDialogProps) {
    const [dataType, setDataType] = useState<'pdf' | 'info'>(defaultDataType)

    if (!item) return null

    const isArticle = type === 'article'
    const itemName = isArticle ? (item as ArticleItem).name : `Order #${(item as Order).order_id}`

    // Generate QR data based on type and data type
    const generateQRData = () => {
        if (isArticle) {
            const article = item as ArticleItem
            return dataType === 'pdf' 
                ? generateArticlePDFQRData(article)
                : generateArticleInfoQRData(article)
        } else {
            const order = item as Order
            return dataType === 'pdf' 
                ? generateOrderPDFQRData(order)
                : generateOrderInfoQRData(order)
        }
    }

    // Get QR code type for title and description
    const getQRType = (): QRCodeDataType => {
        if (isArticle) {
            return dataType === 'pdf' ? 'article-pdf' : 'article-info'
        } else {
            return dataType === 'pdf' ? 'order-pdf' : 'order-info'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <div className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            {getQRCodeTitle(getQRType(), itemName)}
                        </DialogTitle>
                        <p className="text-zinc-400">
                            {getQRCodeDescription(getQRType())}
                        </p>
                    </DialogHeader>

                    {/* Data Type Toggle */}
                    <div className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-lg">
                        <Button
                            variant={dataType === 'info' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDataType('info')}
                            className={`flex items-center gap-2 ${
                                dataType === 'info'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                            }`}
                        >
                            <Info className="h-4 w-4" />
                            Information
                        </Button>
                        <Button
                            variant={dataType === 'pdf' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDataType('pdf')}
                            className={`flex items-center gap-2 ${
                                dataType === 'pdf'
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                            }`}
                        >
                            <Download className="h-4 w-4" />
                            PDF Download
                        </Button>
                    </div>

                    {/* QR Code Generator */}
                    <QRCodeGenerator
                        data={generateQRData()}
                        size={280}
                        title=""
                        description=""
                        showDownload={true}
                        showCopy={true}
                        className="py-4"
                    />

                    {/* Instructions */}
                    <div className="bg-zinc-800 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-white mb-2">How to use:</h4>
                        <ul className="text-xs text-zinc-400 space-y-1">
                            <li>• Scan the QR code with your phone's camera or QR scanner app</li>
                            {dataType === 'pdf' ? (
                                <>
                                    <li>• The QR code contains a download link for the PDF report</li>
                                    <li>• Scanning will trigger the PDF download on your device</li>
                                </>
                            ) : (
                                <>
                                    <li>• The QR code contains {isArticle ? 'article' : 'order'} information in JSON format</li>
                                    <li>• You can copy and paste this data into other applications</li>
                                </>
                            )}
                            <li>• Use the buttons below to download the QR code image or copy the data</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 pt-4 border-t border-zinc-800">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDataType(dataType === 'pdf' ? 'info' : 'pdf')}
                            className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-white transition-colors"
                        >
                            Switch to {dataType === 'pdf' ? 'Info' : 'PDF'} QR
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white transition-colors"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
