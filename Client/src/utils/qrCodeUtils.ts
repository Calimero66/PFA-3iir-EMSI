import { exportArticleToPDF, exportArticleToHTML } from "./exportArticlePDF"
import { exportOrderToPDF, exportOrderToHTML } from "./exportOrderPDF"

// Types for different data types that can be encoded in QR codes
export interface ArticleItem {
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

export interface Order {
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

// QR Code data types
export type QRCodeDataType = 'article-pdf' | 'order-pdf' | 'article-info' | 'order-info' | 'custom-url'

export interface QRCodeData {
    type: QRCodeDataType
    id: number | string
    action: 'download' | 'view' | 'info'
    timestamp: number
    baseUrl?: string
}

/**
 * Generate QR code data for article PDF download
 */
export const generateArticlePDFQRData = (article: ArticleItem): string => {
    // Create a download URL that works with our React Router setup
    const downloadUrl = `${window.location.origin}/download/article/${article.id}/pdf`

    return downloadUrl
}

/**
 * Generate QR code data for order PDF download
 */
export const generateOrderPDFQRData = (order: Order | any): string => {
    // Create a download URL that works with our React Router setup
    const downloadUrl = `${window.location.origin}/download/order/${order.order_id}/pdf`

    return downloadUrl
}

/**
 * Generate QR code data for article information (JSON format)
 */
export const generateArticleInfoQRData = (article: ArticleItem): string => {
    const articleInfo = {
        type: 'article-info',
        id: article.id,
        barcode: article.barcode,
        name: article.name,
        price: article.price,
        quantity: article.quantity,
        category: article.category?.name || 'N/A',
        supplier: article.supplier?.name || 'N/A',
        created_at: article.created_at,
        timestamp: Date.now()
    }
    
    return JSON.stringify(articleInfo)
}

/**
 * Generate QR code data for order information (JSON format)
 */
export const generateOrderInfoQRData = (order: Order | any): string => {
    const orderInfo = {
        type: 'order-info',
        id: order.order_id,
        user: order.user,
        total_amount: order.total_amount,
        payment_status: order.payment_status || 'N/A',
        items_count: order.items_breakdown?.length || order.total_items || 0,
        created_at: order.created_at,
        timestamp: Date.now()
    }

    return JSON.stringify(orderInfo)
}

/**
 * Generate QR code data for custom URL
 */
export const generateCustomURLQRData = (url: string): string => {
    // Validate URL
    try {
        new URL(url)
        return url
    } catch (error) {
        console.error('Invalid URL provided:', url)
        return `${window.location.origin}${url.startsWith('/') ? url : '/' + url}`
    }
}

/**
 * Create a data URL that triggers PDF download when accessed
 * This creates a special URL that can be embedded in QR codes
 */
export const createPDFDownloadDataURL = (type: 'article' | 'order', data: ArticleItem | Order): string => {
    const encodedData = btoa(JSON.stringify(data))
    const downloadAction = `javascript:void(function(){
        try {
            const data = JSON.parse(atob('${encodedData}'));
            if ('${type}' === 'article') {
                // Dynamically import and execute article PDF export
                import('${window.location.origin}/src/utils/exportArticlePDF.js').then(module => {
                    module.exportArticleToPDF(data);
                }).catch(() => {
                    // Fallback: redirect to download page
                    window.location.href = '${window.location.origin}/download/article/' + data.id + '/pdf';
                });
            } else if ('${type}' === 'order') {
                // Dynamically import and execute order PDF export
                import('${window.location.origin}/src/utils/exportOrderPDF.js').then(module => {
                    module.exportOrderToPDF(data);
                }).catch(() => {
                    // Fallback: redirect to download page
                    window.location.href = '${window.location.origin}/download/order/' + data.order_id + '/pdf';
                });
            }
        } catch (e) {
            console.error('QR Code download error:', e);
            alert('Unable to download PDF. Please try from the application.');
        }
    })()`
    
    return downloadAction
}

/**
 * Handle QR code scan result - parse and execute appropriate action
 */
export const handleQRCodeScan = (qrData: string): void => {
    try {
        // Check if it's a URL
        if (qrData.startsWith('http') || qrData.startsWith('javascript:')) {
            if (qrData.startsWith('javascript:')) {
                // Execute JavaScript action (for PDF downloads)
                eval(qrData.replace('javascript:', ''))
            } else {
                // Open URL
                window.open(qrData, '_blank')
            }
            return
        }

        // Try to parse as JSON
        const parsedData = JSON.parse(qrData)
        
        switch (parsedData.type) {
            case 'article-info':
                console.log('Article info from QR:', parsedData)
                alert(`Article: ${parsedData.name}\nPrice: $${parsedData.price}\nQuantity: ${parsedData.quantity}`)
                break
                
            case 'order-info':
                console.log('Order info from QR:', parsedData)
                alert(`Order #${parsedData.id}\nUser: ${parsedData.user}\nTotal: $${parsedData.total_amount}`)
                break
                
            default:
                console.log('Unknown QR data type:', parsedData)
                alert('QR code contains: ' + qrData)
        }
    } catch (error) {
        console.error('Error parsing QR code data:', error)
        // Treat as plain text
        alert('QR code contains: ' + qrData)
    }
}

/**
 * Generate a simple download link that works across devices
 */
export const generateSimpleDownloadLink = (type: 'article' | 'order', id: number): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/#/download/${type}/${id}`
}

/**
 * Validate QR code data before generation
 */
export const validateQRData = (data: string): boolean => {
    if (!data || data.trim().length === 0) {
        return false
    }
    
    // Check if data is too long (QR codes have limits)
    if (data.length > 2000) {
        console.warn('QR code data is very long and may not scan properly')
        return false
    }
    
    return true
}

/**
 * Get QR code display title based on data type
 */
export const getQRCodeTitle = (type: QRCodeDataType, itemName?: string): string => {
    switch (type) {
        case 'article-pdf':
            return `Download Article PDF${itemName ? `: ${itemName}` : ''}`
        case 'order-pdf':
            return `Download Order PDF${itemName ? `: ${itemName}` : ''}`
        case 'article-info':
            return `Article Information${itemName ? `: ${itemName}` : ''}`
        case 'order-info':
            return `Order Information${itemName ? `: ${itemName}` : ''}`
        case 'custom-url':
            return 'Custom Link'
        default:
            return 'QR Code'
    }
}

/**
 * Get QR code description based on data type
 */
export const getQRCodeDescription = (type: QRCodeDataType): string => {
    switch (type) {
        case 'article-pdf':
            return 'Scan to download the article PDF report'
        case 'order-pdf':
            return 'Scan to download the order PDF report'
        case 'article-info':
            return 'Scan to view article information'
        case 'order-info':
            return 'Scan to view order information'
        case 'custom-url':
            return 'Scan to open the link'
        default:
            return 'Scan this QR code with your device'
    }
}
