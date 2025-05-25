import { ReactNode } from "react"

export function Card({ children }: { children: ReactNode }) {
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-md">
            {children}
        </div>
    )
}

export function CardHeader({ children }: { children: ReactNode }) {
    return (
        <div className="p-4 border-b border-zinc-700">
            {children}
        </div>
    )
}

export function CardContent({ children }: { children: ReactNode }) {
    return (
        <div className="p-4">
            {children}
        </div>
    )
}

export function CardTitle({ children }: { children: ReactNode }) {
    return (
        <h2 className="text-lg font-bold text-white">
            {children}
        </h2>
    )
}