import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export const exportArticleToPDF = (article: ArticleItem) => {
    try {
        console.log('Starting PDF export for article:', article.id)

        // Create new PDF document
        const doc = new jsPDF()

        // Set background to white for better compatibility
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, 210, 297, 'F')
    
        // Header
        doc.setFontSize(20)
        doc.setTextColor(0, 0, 0) // Black text
        doc.setFont('helvetica', 'bold')
        doc.text('Article Details Report', 20, 30)

        // Article name and date
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100) // Gray text
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
        doc.text(`Article: ${article.name}`, 20, 55)

        // Article Information Section
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('Article Information', 20, 80)

        // Basic Info - Left Column
        const leftCol = 20
        const rightCol = 110
        const infoY = 95

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        // Left column
        doc.setTextColor(100, 100, 100)
        doc.text('Article ID:', leftCol, infoY)
        doc.setTextColor(0, 0, 0)
        doc.text(`#${article.id}`, leftCol + 25, infoY)

        doc.setTextColor(100, 100, 100)
        doc.text('Barcode:', leftCol, infoY + 12)
        doc.setTextColor(0, 0, 0)
        doc.text(article.barcode, leftCol + 25, infoY + 12)

        doc.setTextColor(100, 100, 100)
        doc.text('Name:', leftCol, infoY + 24)
        doc.setTextColor(0, 0, 0)
        doc.text(article.name, leftCol + 25, infoY + 24)

        doc.setTextColor(100, 100, 100)
        doc.text('Price:', leftCol, infoY + 36)
        doc.setTextColor(0, 0, 0)
        doc.text(`$${article.price}`, leftCol + 25, infoY + 36)

        doc.setTextColor(100, 100, 100)
        doc.text('Quantity:', leftCol, infoY + 48)
        doc.setTextColor(0, 0, 0)
        doc.text(`${article.quantity} units`, leftCol + 25, infoY + 48)

        // Right column
        doc.setTextColor(100, 100, 100)
        doc.text('Category:', rightCol, infoY)
        doc.setTextColor(0, 0, 0)
        doc.text(article.category?.name || 'N/A', rightCol + 25, infoY)

        doc.setTextColor(100, 100, 100)
        doc.text('Supplier:', rightCol, infoY + 12)
        doc.setTextColor(0, 0, 0)
        doc.text(article.supplier?.name || 'N/A', rightCol + 25, infoY + 12)

        doc.setTextColor(100, 100, 100)
        doc.text('Created By:', rightCol, infoY + 24)
        doc.setTextColor(0, 0, 0)
        doc.text(article.user?.name || 'N/A', rightCol + 25, infoY + 24)

        doc.setTextColor(100, 100, 100)
        doc.text('Created At:', rightCol, infoY + 36)
        doc.setTextColor(0, 0, 0)
        doc.text(new Date(article.created_at).toLocaleDateString(), rightCol + 25, infoY + 36)

        doc.setTextColor(100, 100, 100)
        doc.text('Updated At:', rightCol, infoY + 48)
        doc.setTextColor(0, 0, 0)
        doc.text(new Date(article.updated_at).toLocaleDateString(), rightCol + 25, infoY + 48)

        // Article Details Table
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('Article Details', 20, 170)

        // Prepare table data
        const tableData = [
            ['Property', 'Value'],
            ['Article ID', `#${article.id}`],
            ['Barcode', article.barcode],
            ['Name', article.name],
            ['Price', `$${article.price}`],
            ['Quantity', `${article.quantity} units`],
            ['Category', article.category?.name || 'N/A'],
            ['Supplier', article.supplier?.name || 'N/A'],
            ['Created By', article.user?.name || 'N/A'],
            ['Created Date', new Date(article.created_at).toLocaleDateString()],
            ['Updated Date', new Date(article.updated_at).toLocaleDateString()]
        ]

        // Create table using autoTable
        autoTable(doc, {
            startY: 180,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'striped',
            styles: {
                fontSize: 10,
                textColor: [0, 0, 0],
                fillColor: [245, 245, 245]
            },
            headStyles: {
                fillColor: [147, 51, 234], // Purple
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
                1: { halign: 'left' }
            },
            margin: { left: 20, right: 20 }
        })

        // Notes section if available
        if (article.notes) {
            const finalY = (doc as any).lastAutoTable.finalY || 240
            doc.setFontSize(14)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'bold')
            doc.text('Notes', 20, finalY + 20)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(50, 50, 50)
            const splitNotes = doc.splitTextToSize(article.notes, 170)
            doc.text(splitNotes, 20, finalY + 35)
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text('Generated by Article Management System', 20, pageHeight - 20)
        doc.text(`Article #${article.id} - ${article.name}`, 20, pageHeight - 10)

        // Save the PDF
        const filename = `Article_${article.id}_${article.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        console.log('Saving PDF as:', filename)
        doc.save(filename)

        console.log('PDF export completed successfully')

    } catch (error) {
        console.error('Error exporting PDF:', error)
        alert('Failed to export PDF. Please try again.')
    }
}

// Alternative export function using browser print
export const exportArticleToHTML = (article: ArticleItem) => {
    try {
        console.log('Starting HTML export for article:', article.id)

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Article #${article.id} - ${article.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; }
                .article-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .info-section h3 { color: #7c3aed; margin-bottom: 10px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .label { color: #666; font-weight: bold; }
                .value { font-weight: normal; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #7c3aed; color: white; }
                .notes { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Article Details Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                <p>Article: ${article.name}</p>
            </div>

            <div class="article-info">
                <div class="info-section">
                    <h3>Basic Information</h3>
                    <div class="info-row">
                        <span class="label">Article ID:</span>
                        <span class="value">#${article.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Barcode:</span>
                        <span class="value">${article.barcode}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">${article.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Price:</span>
                        <span class="value">$${article.price}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Quantity:</span>
                        <span class="value">${article.quantity} units</span>
                    </div>
                </div>

                <div class="info-section">
                    <h3>Related Information</h3>
                    <div class="info-row">
                        <span class="label">Category:</span>
                        <span class="value">${article.category?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Supplier:</span>
                        <span class="value">${article.supplier?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Created By:</span>
                        <span class="value">${article.user?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Created At:</span>
                        <span class="value">${new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Updated At:</span>
                        <span class="value">${new Date(article.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            ${article.notes ? `
                <div class="notes">
                    <h3>Notes</h3>
                    <p>${article.notes}</p>
                </div>
            ` : ''}

            <div class="footer">
                <p>Generated by Article Management System</p>
                <p>Article #${article.id} - ${article.name}</p>
            </div>
        </body>
        </html>
        `

        // Open in new window and trigger print
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(htmlContent)
            printWindow.document.close()
            printWindow.focus()

            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print()
            }, 500)
        } else {
            alert('Please allow popups to export the article report.')
        }

        console.log('HTML export completed successfully')

    } catch (error) {
        console.error('Error exporting HTML:', error)
        alert('Failed to export report. Please try again.')
    }
}
