import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText } from "lucide-react"

// Types for the stock movement
type StockMovement = {
    id: number
    type: "in" | "out"
    quantity: number
    date: string
    article_name: string
    reason: string
    reasonAttachment?: string
}

interface StockMovementsTableProps {
    movements: StockMovement[]
    onViewAttachment?: (attachmentUrl: string) => void
    formatDate: (date: string) => string
}

export default function StockMovementsTable({ movements, onViewAttachment, formatDate }: StockMovementsTableProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white">Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800">
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Article</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((movement) => (
                            <TableRow key={movement.id} className="border-zinc-800">
                                <TableCell className="text-white">{movement.id}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            movement.type === "in"
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-red-500/20 text-red-500"
                                        }`}
                                    >
                                        {movement.type === "in" ? "Stock In" : "Stock Out"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-white">{movement.article_name}</TableCell>
                                <TableCell className="text-white">
                                    <span className={movement.type === "in" ? "text-green-400" : "text-red-400"}>
                                        {movement.type === "in" ? "+" : "-"}
                                        {movement.quantity}
                                    </span>
                                </TableCell>
                                <TableCell className="text-white">{formatDate(movement.date)}</TableCell>
                                <TableCell className="text-white">{movement.reason || "-"}</TableCell>
                                <TableCell>
                                    {movement.reasonAttachment ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
                                            onClick={() => onViewAttachment?.(movement.reasonAttachment!)}
                                        >
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <span className="text-zinc-500 text-sm">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {movements.length === 0 && (
                            <TableRow className="border-zinc-800">
                                <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                                    No stock movements found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
