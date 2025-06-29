import { useEffect, useRef, useState } from "react"
import QRCodeStyling from "qr-code-styling"
import { Button } from "@/components/ui/button"
import { Download, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface QRCodeGeneratorProps {
    data: string
    size?: number
    title?: string
    description?: string
    showDownload?: boolean
    showCopy?: boolean
    className?: string
    onGenerated?: (qrCode: QRCodeStyling) => void
}

export function QRCodeGenerator({
    data,
    size = 300,
    title,
    description,
    showDownload = true,
    showCopy = true,
    className = "",
    onGenerated
}: QRCodeGeneratorProps) {
    const qrRef = useRef<HTMLDivElement>(null)
    const qrCodeRef = useRef<QRCodeStyling | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    // QR Code styling configuration
    const qrCodeConfig = {
        width: size,
        height: size,
        type: "svg" as const,
        data: data,
        image: undefined, // You can add a logo here if needed
        dotsOptions: {
            color: "#7c3aed", // Purple color matching your theme
            type: "rounded" as const
        },
        backgroundOptions: {
            color: "#ffffff",
        },
        cornersSquareOptions: {
            color: "#7c3aed",
            type: "extra-rounded" as const,
        },
        cornersDotOptions: {
            color: "#7c3aed",
            type: "dot" as const,
        },
        qrOptions: {
            errorCorrectionLevel: "M" as const
        }
    }

    useEffect(() => {
        if (!data || !qrRef.current) return

        setIsGenerating(true)

        try {
            // Create new QR code instance
            const qrCode = new QRCodeStyling(qrCodeConfig)
            qrCodeRef.current = qrCode

            // Clear previous QR code
            qrRef.current.innerHTML = ""

            // Append QR code to container
            qrCode.append(qrRef.current)

            // Call onGenerated callback if provided
            if (onGenerated) {
                onGenerated(qrCode)
            }

            console.log("QR Code generated successfully for data:", data.substring(0, 50) + "...")
        } catch (error) {
            console.error("Error generating QR code:", error)
            toast.error("Failed to generate QR code", {
                description: "Please try again or contact support.",
                duration: 5000,
            })
        } finally {
            setIsGenerating(false)
        }
    }, [data, size])

    const handleDownloadQR = async () => {
        if (!qrCodeRef.current) {
            toast.error("QR code not ready", {
                description: "Please wait for the QR code to generate.",
                duration: 3000,
            })
            return
        }

        try {
            // Download as PNG
            await qrCodeRef.current.download({
                name: `qr-code-${Date.now()}`,
                extension: "png"
            })
            
            toast.success("QR code downloaded", {
                description: "The QR code has been saved to your downloads folder.",
                duration: 3000,
            })
        } catch (error) {
            console.error("Error downloading QR code:", error)
            toast.error("Failed to download QR code", {
                description: "Please try again.",
                duration: 5000,
            })
        }
    }

    const handleCopyData = async () => {
        try {
            await navigator.clipboard.writeText(data)
            toast.success("Data copied", {
                description: "The QR code data has been copied to your clipboard.",
                duration: 3000,
            })
        } catch (error) {
            console.error("Error copying data:", error)
            toast.error("Failed to copy data", {
                description: "Please copy the data manually.",
                duration: 5000,
            })
        }
    }

    const handleRegenerateQR = () => {
        if (qrCodeRef.current && data) {
            setIsGenerating(true)
            try {
                qrCodeRef.current.update({ data })
                toast.success("QR code regenerated", {
                    description: "The QR code has been updated.",
                    duration: 3000,
                })
            } catch (error) {
                console.error("Error regenerating QR code:", error)
                toast.error("Failed to regenerate QR code", {
                    description: "Please refresh the page.",
                    duration: 5000,
                })
            } finally {
                setIsGenerating(false)
            }
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {title && (
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {description && (
                        <p className="text-sm text-zinc-400 mt-1">{description}</p>
                    )}
                </div>
            )}

            <div className="flex justify-center">
                <div className="relative">
                    <div 
                        ref={qrRef} 
                        className="bg-white p-4 rounded-lg shadow-lg"
                        style={{ minWidth: size, minHeight: size }}
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {(showDownload || showCopy) && (
                <div className="flex justify-center gap-2">
                    {showDownload && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadQR}
                            disabled={isGenerating}
                            className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download QR
                        </Button>
                    )}
                    {showCopy && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyData}
                            disabled={isGenerating}
                            className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-white transition-colors"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Data
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateQR}
                        disabled={isGenerating}
                        className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-white transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                    </Button>
                </div>
            )}

            {data && (
                <div className="text-center">
                    <p className="text-xs text-zinc-500 break-all max-w-md mx-auto">
                        Data: {data.length > 100 ? `${data.substring(0, 100)}...` : data}
                    </p>
                </div>
            )}
        </div>
    )
}
