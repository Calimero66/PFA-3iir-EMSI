import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { exportArticleToPDF, exportArticleToHTML } from "@/utils/exportArticlePDF"
import api from "@/lib/api"
import { toast, Toaster } from "sonner"

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

export default function ArticleDownload() {
    const { id, format } = useParams<{ id: string; format: string }>()
    const navigate = useNavigate()
    const [article, setArticle] = useState<ArticleItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchArticle(parseInt(id))
        } else {
            setError("Invalid article ID")
            setLoading(false)
        }
    }, [id])

    const fetchArticle = async (articleId: number) => {
        try {
            setLoading(true)
            const response = await api.get(`/articles/${articleId}`)
            
            if (response.data && response.data.data) {
                setArticle(response.data.data)
                // Auto-download if format is specified
                if (format === 'pdf') {
                    setTimeout(() => {
                        handleDownload(response.data.data)
                    }, 1000) // Small delay to show the page
                }
            } else {
                setError("Article not found")
            }
        } catch (error: any) {
            console.error("Error fetching article:", error)
            if (error.response?.status === 404) {
                setError("Article not found")
            } else {
                setError("Failed to load article. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (articleData?: ArticleItem) => {
        const targetArticle = articleData || article
        if (!targetArticle) {
            toast.error("No article data available")
            return
        }

        setDownloading(true)
        try {
            console.log('Starting download for article:', targetArticle.id)
            
            if (format === 'pdf' || !format) {
                exportArticleToPDF(targetArticle)
                toast.success("PDF download started", {
                    description: `Downloading ${targetArticle.name} report`,
                    duration: 3000,
                })
            } else {
                exportArticleToHTML(targetArticle)
                toast.success("HTML export opened", {
                    description: `Opening ${targetArticle.name} report`,
                    duration: 3000,
                })
            }
        } catch (error) {
            console.error('Download failed:', error)
            toast.error("Download failed", {
                description: "Please try again or contact support",
                duration: 5000,
            })
        } finally {
            setDownloading(false)
        }
    }

    const handleGoBack = () => {
        navigate('/Articles')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#18181b',
                            border: '1px solid #3f3f46',
                            color: '#ffffff',
                        },
                    }}
                />
                <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading article...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#18181b',
                            border: '1px solid #3f3f46',
                            color: '#ffffff',
                        },
                    }}
                />
                <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Download Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-zinc-400">{error}</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleGoBack}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go Back
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        color: '#ffffff',
                    },
                }}
            />
            <Card className="bg-zinc-900 border-zinc-800 w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        Article Download
                    </CardTitle>
                    <p className="text-zinc-400">Ready to download article report</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {article && (
                        <div className="space-y-4">
                            <div className="bg-zinc-800 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-white">{article.name}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-zinc-400">ID:</span>
                                        <span className="text-white ml-2">#{article.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Price:</span>
                                        <span className="text-white ml-2">${article.price}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Category:</span>
                                        <span className="text-white ml-2">{article.category?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Quantity:</span>
                                        <span className="text-white ml-2">{article.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleDownload()}
                                    disabled={downloading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {downloading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleGoBack}
                                    variant="outline"
                                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </div>

                            <div className="text-xs text-zinc-500 text-center">
                                <p>This page was accessed via QR code scan</p>
                                <p>The download should start automatically</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
