"use client"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

interface BarcodeInputProps {
    value: string
    onChange: (value: string) => void
}

export function BarcodeInput({ value, onChange }: BarcodeInputProps) {
    const handleValueChange = (newValue: string) => {
        onChange(newValue)
    }

    return (
        <div className="grid gap-2">
            <Label htmlFor="barcode" className="text-zinc-400">
                Barcode Number (12 digits)
            </Label>
            <div className="flex justify-center w-full">
                <InputOTP maxLength={12} value={value} onChange={handleValueChange} pattern="[0-9]*" className="gap-1 w-fit">
                    <InputOTPGroup className="gap-1">
                        <InputOTPSlot index={0} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                    </InputOTPGroup>
                    <InputOTPGroup className="gap-1">
                        <InputOTPSlot index={1} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={2} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={3} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={4} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={5} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={6} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                    </InputOTPGroup>
                    <InputOTPGroup className="gap-1">
                        <InputOTPSlot index={7} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={8} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={9} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={10} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                        <InputOTPSlot index={11} className="w-9 h-10 bg-zinc-800 border-zinc-700 text-white" />
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <p className="text-xs text-zinc-500 mt-1 text-center">Enter the 12-digit barcode number</p>
        </div>
    )
}
