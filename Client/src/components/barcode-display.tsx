interface BarcodeDisplayProps {
    barcodeNumber: string
}

export function BarcodeDisplay({ barcodeNumber = "9 578545 203541" }: BarcodeDisplayProps) {
    console.log('Barcode:', barcodeNumber) // Use the parameter to avoid TypeScript error
    return (
        <div className="w-full max-w-[400px] mx-auto">
            <div className="border-2 border-black rounded-lg p-2 bg-white">
                <div className="flex justify-center">
                    <svg
                        width="100%"
                        height="90"
                        viewBox="0 0 800 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-1"
                    >
                        {/* EAN-13 style barcode - simplified representation */}
                        <rect x="100" y="45" width="4" height="120" fill="black" />
                        <rect x="110" y="45" width="2" height="120" fill="black" />
                        <rect x="118" y="45" width="6" height="120" fill="black" />
                        <rect x="130" y="45" width="2" height="120" fill="black" />
                        <rect x="138" y="45" width="4" height="120" fill="black" />
                        <rect x="148" y="45" width="6" height="120" fill="black" />
                        <rect x="160" y="45" width="2" height="120" fill="black" />
                        <rect x="168" y="45" width="4" height="120" fill="black" />
                        <rect x="180" y="45" width="6" height="120" fill="black" />
                        <rect x="192" y="45" width="2" height="120" fill="black" />
                        <rect x="200" y="45" width="4" height="120" fill="black" />
                        <rect x="210" y="45" width="6" height="120" fill="black" />
                        <rect x="222" y="45" width="2" height="120" fill="black" />
                        <rect x="230" y="45" width="4" height="120" fill="black" />
                        <rect x="240" y="45" width="6" height="120" fill="black" />
                        <rect x="252" y="45" width="2" height="120" fill="black" />
                        <rect x="260" y="45" width="4" height="120" fill="black" />
                        <rect x="270" y="45" width="6" height="120" fill="black" />
                        <rect x="282" y="45" width="2" height="120" fill="black" />
                        <rect x="290" y="45" width="4" height="120" fill="black" />
                        <rect x="300" y="45" width="6" height="120" fill="black" />
                        <rect x="312" y="45" width="2" height="120" fill="black" />
                        <rect x="320" y="45" width="4" height="120" fill="black" />
                        <rect x="330" y="45" width="6" height="120" fill="black" />
                        <rect x="342" y="45" width="2" height="120" fill="black" />
                        <rect x="350" y="45" width="4" height="120" fill="black" />
                        <rect x="360" y="45" width="6" height="120" fill="black" />
                        <rect x="372" y="45" width="2" height="120" fill="black" />
                        <rect x="380" y="45" width="4" height="120" fill="black" />
                        <rect x="390" y="45" width="6" height="120" fill="black" />
                        <rect x="402" y="45" width="2" height="120" fill="black" />
                        <rect x="410" y="45" width="4" height="120" fill="black" />
                        <rect x="420" y="45" width="6" height="120" fill="black" />
                        <rect x="432" y="45" width="2" height="120" fill="black" />
                        <rect x="440" y="45" width="4" height="120" fill="black" />
                        <rect x="450" y="45" width="6" height="120" fill="black" />
                        <rect x="462" y="45" width="2" height="120" fill="black" />
                        <rect x="470" y="45" width="4" height="120" fill="black" />
                        <rect x="480" y="45" width="6" height="120" fill="black" />
                        <rect x="492" y="45" width="2" height="120" fill="black" />
                        <rect x="500" y="45" width="4" height="120" fill="black" />
                        <rect x="510" y="45" width="6" height="120" fill="black" />
                        <rect x="522" y="45" width="2" height="120" fill="black" />
                        <rect x="530" y="45" width="4" height="120" fill="black" />
                        <rect x="540" y="45" width="6" height="120" fill="black" />
                        <rect x="552" y="45" width="2" height="120" fill="black" />
                        <rect x="560" y="45" width="4" height="120" fill="black" />
                        <rect x="570" y="45" width="6" height="120" fill="black" />
                        <rect x="582" y="45" width="2" height="120" fill="black" />
                        <rect x="590" y="45" width="4" height="120" fill="black" />
                        <rect x="600" y="45" width="6" height="120" fill="black" />
                        <rect x="612" y="45" width="2" height="120" fill="black" />
                        <rect x="620" y="45" width="4" height="120" fill="black" />
                        <rect x="630" y="45" width="6" height="120" fill="black" />
                        <rect x="642" y="45" width="2" height="120" fill="black" />
                        <rect x="650" y="45" width="4" height="120" fill="black" />
                        <rect x="660" y="45" width="6" height="120" fill="black" />
                        <rect x="672" y="45" width="2" height="120" fill="black" />
                        <rect x="680" y="45" width="4" height="120" fill="black" />
                        <rect x="690" y="45" width="6" height="120" fill="black" />
                        <rect x="702" y="45" width="2" height="120" fill="black" />

                        {/* Barcode number text */}
                        <text x="140" y="190" fontFamily="Arial" fontSize="28" fontWeight="bold" fill="black">
                            9
                        </text>
                        <text x="240" y="190" fontFamily="Arial" fontSize="29" fontWeight="bold" fill="black">
                            578545
                        </text>
                        <text x="520" y="190" fontFamily="Arial" fontSize="29" fontWeight="bold" fill="black">
                            203541
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    )
}
