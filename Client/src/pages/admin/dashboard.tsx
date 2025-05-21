import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DashboardPage() {
    return (
        <div className="p-6 space-y-6 text-white">
            <div>
                <h1 className="text-2xl font-bold text-white">Stock Overview</h1>
                <p className="text-zinc-400">Current inventory status</p>
            </div>

            {/* <div className="flex justify-center w-full"> */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-7xl mx-auto">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Items</CardTitle>
                        </CardHeader>
                        <CardContent className="text-white">
                            <div className="text-3xl font-bold">1,245</div>
                            <div className="flex items-center text-sm text-green-500 mt-1">
                                <ArrowUp className="h-4 w-4 mr-1" />
                                <span>+32</span>
                                <span className="ml-1">+2.6%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Low Stock Items</CardTitle>
                        </CardHeader>
                        <CardContent className="text-white">
                            <div className="text-3xl font-bold">28</div>
                            <div className="flex items-center text-sm text-red-500 mt-1">
                                <ArrowDown className="h-4 w-4 mr-1" />
                                <span>-5</span>
                                <span className="ml-1">-15.2%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            {/* </div> */}

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl text-white font-bold">Stock Items</CardTitle>
                    <div className="text-xs text-zinc-400">
                        FPS <span className="text-white">N/A</span> GPU <span className="text-white">7%</span> CPU{" "}
                        <span className="text-white">18%</span> LAT <span className="text-white">N/A</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800">
                                <TableHead className="w-[300px]">Item</TableHead>
                                <TableHead>Change</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Reorder Point</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-white font-bold">
                            <TableRow className="border-zinc-800">
                                <TableCell className="">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800"></div>
                                        <div>
                                            <div>Laptop Computers</div>
                                            <div className="text-zinc-400 text-xs">$1,299.99</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-red-500">-3</TableCell>
                                <TableCell>24</TableCell>
                                <TableCell>10</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">In Stock</span>
                                </TableCell>
                                <TableCell>05.10.2023</TableCell>
                                <TableCell>Warehouse A</TableCell>
                                <TableCell>...</TableCell>
                            </TableRow>
                            <TableRow className="border-zinc-800">
                                <TableCell className="">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800"></div>
                                        <div>
                                            <div>Office Chairs</div>
                                            <div className="text-zinc-400 text-xs">$249.99</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-red-500">-12</TableCell>
                                <TableCell>8</TableCell>
                                <TableCell>15</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">Low Stock</span>
                                </TableCell>
                                <TableCell>12.09.2023</TableCell>
                                <TableCell>Warehouse B</TableCell>
                                <TableCell>...</TableCell>
                            </TableRow>
                            <TableRow className="border-zinc-800 font-bold">
                                <TableCell className="">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800"></div>
                                        <div>
                                            <div>Printer Ink</div>
                                            <div className="text-zinc-400 text-xs">$89.99</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-red-500">-25</TableCell>
                                <TableCell>0</TableCell>
                                <TableCell>30</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-500">Out of Stock</span>
                                </TableCell>
                                <TableCell>21.08.2023</TableCell>
                                <TableCell>Warehouse A</TableCell>
                                <TableCell>...</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
