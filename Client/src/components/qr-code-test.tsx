import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { 
    generateArticlePDFQRData, 
    generateArticleInfoQRData,
    generateCustomURLQRData,
    handleQRCodeScan 
} from "@/utils/qrCodeUtils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, TestTube } from "lucide-react"

// Sample test data
const sampleArticle = {
    id: 1,
    barcode: "123456789012",
    name: "Test Article",
    price: 29.99,
    quantity: 100,
    category_id: 1,
    supplier_id: 1,
    user_id: 1,
    category: {
        id: 1,
        name: "Electronics"
    },
    supplier: {
        id: 1,
        name: "Test Supplier"
    },
    user: {
        id: 1,
        name: "Test User"
    },
    notes: "This is a test article for QR code functionality",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}

export function QRCodeTest() {
    const [customUrl, setCustomUrl] = useState("https://example.com")
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [scanResult, setScanResult] = useState("")

    const handleTestScan = (data: string) => {
        setScanResult(data)
        try {
            handleQRCodeScan(data)
        } catch (error) {
            console.error("Test scan error:", error)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">QR Code Test Page</h1>
                    <p className="text-zinc-400">Test the QR code generation and scanning functionality</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Article PDF QR Code */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-purple-500" />
                                Article PDF QR
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <QRCodeGenerator
                                data={generateArticlePDFQRData(sampleArticle)}
                                size={200}
                                title="PDF Download"
                                description="Scan to download article PDF"
                                showDownload={true}
                                showCopy={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Article Info QR Code */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-blue-500" />
                                Article Info QR
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <QRCodeGenerator
                                data={generateArticleInfoQRData(sampleArticle)}
                                size={200}
                                title="Article Information"
                                description="Scan to view article details"
                                showDownload={true}
                                showCopy={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Custom URL QR Code */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-green-500" />
                                Custom URL QR
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-url" className="text-zinc-400">
                                    Custom URL
                                </Label>
                                <Input
                                    id="custom-url"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="Enter URL"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <QRCodeGenerator
                                data={generateCustomURLQRData(customUrl)}
                                size={180}
                                title=""
                                description=""
                                showDownload={true}
                                showCopy={true}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Test Controls */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TestTube className="h-5 w-5 text-yellow-500" />
                            Test Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 flex-wrap">
                            <Button
                                onClick={() => setTestDialogOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Open QR Dialog
                            </Button>
                            <Button
                                onClick={() => handleTestScan(generateArticleInfoQRData(sampleArticle))}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Test Article Info Scan
                            </Button>
                            <Button
                                onClick={() => handleTestScan(customUrl)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Test URL Scan
                            </Button>
                        </div>

                        {scanResult && (
                            <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
                                <h4 className="text-sm font-semibold text-white mb-2">Last Scan Result:</h4>
                                <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-all">
                                    {scanResult}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">How to Test</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-zinc-400">
                            <p><strong className="text-white">1. QR Code Generation:</strong> The QR codes above are automatically generated with different data types.</p>
                            <p><strong className="text-white">2. Download QR:</strong> Click "Download QR" to save the QR code image to your device.</p>
                            <p><strong className="text-white">3. Copy Data:</strong> Click "Copy Data" to copy the QR code content to your clipboard.</p>
                            <p><strong className="text-white">4. Scan Test:</strong> Use your phone's camera or QR scanner app to scan the codes.</p>
                            <p><strong className="text-white">5. Dialog Test:</strong> Click "Open QR Dialog" to test the dialog component.</p>
                            <p><strong className="text-white">6. Custom URL:</strong> Change the URL input to generate different QR codes.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Test Dialog */}
            <QRCodeDialog
                open={testDialogOpen}
                onOpenChange={setTestDialogOpen}
                item={sampleArticle}
                type="article"
                defaultDataType="pdf"
            />
        </div>
    )
}
