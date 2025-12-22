"use client"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, AlertTriangle, CheckCircle, MoreVertical, Edit, Eye, Trash2, Save, Loader2 } from "lucide-react"
import { useInventory, type TonerColor } from "@/context/inventory-context"
import { useDevices } from "@/context/device-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function TonerStockPage() {
  const { tonerStock, getLowStockToners, loading, deleteTonerStock, updateTonerStockEntry, getPrinters } = useInventory()
  const { devices } = useDevices()
  const printers = getPrinters()
  const lowStockToners = getLowStockToners()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editStock, setEditStock] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    currentStock: "",
    lowStockThreshold: "",
    printerId: "",
  })
  const [editLoading, setEditLoading] = useState(false)

  // Helper function to get model number from printer device
  const getPrinterModelNumber = (printerId?: string) => {
    if (!printerId) return "N/A"
    const printer = devices.find((d) => d.id === printerId)
    return printer?.modelNumber || "N/A"
  }

  // Get printer display with model number
  const getPrinterDisplay = (printerId?: string, printerName?: string) => {
    // First try to find by printerId
    if (printerId) {
      const printerDevice = devices.find((d) => d.id === printerId && d.type === "Printer")
      if (printerDevice) {
        const displayName = printerName || `${printerDevice.assetNumber || printerDevice.serialNumber} - ${printerDevice.assignedTo || "Unassigned"}`
        if (printerDevice.modelNumber && !displayName.includes(printerDevice.modelNumber)) {
          return `${displayName} (${printerDevice.modelNumber})`
        }
        return displayName
      }
    }
    
    // If printerId not found, try to find by printerName
    if (printerName) {
      const printerDevice = devices.find((d) => {
        if (d.type !== "Printer") return false
        return (
          printerName.includes(d.assetNumber || "") || 
          printerName.includes(d.serialNumber || "") ||
          (d.assignedTo && printerName.includes(d.assignedTo))
        )
      })
      if (printerDevice?.modelNumber && !printerName.includes(printerDevice.modelNumber)) {
        return `${printerName} (${printerDevice.modelNumber})`
      }
    }
    
    return printerName || "N/A"
  }

  // Handle view stock details
  const handleView = (stock: any) => {
    toast.info("View Stock Details", {
      description: `Model: ${stock.model}, Color: ${stock.color || "B&W"}, Stock: ${stock.currentStock} units`,
      duration: 3000,
    })
  }

  // Handle edit stock
  const handleEdit = (stock: any) => {
    setEditStock(stock)
    setEditFormData({
      currentStock: stock.currentStock.toString(),
      lowStockThreshold: stock.lowStockThreshold.toString(),
      printerId: stock.printerId || "",
    })
    setDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editStock) return

    setEditLoading(true)
    try {
      await updateTonerStockEntry(editStock.id, {
        currentStock: parseInt(editFormData.currentStock),
        lowStockThreshold: parseInt(editFormData.lowStockThreshold),
        printerId: editFormData.printerId || undefined,
      })
      
      toast.success("Stock Updated", {
        description: `Stock entry for ${editStock.model} has been updated successfully.`,
        duration: 3000,
      })
      
      setDialogOpen(false)
      setEditStock(null)
      setEditFormData({
        currentStock: "",
        lowStockThreshold: "",
        printerId: "",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update stock entry. Please try again.",
      })
    } finally {
      setEditLoading(false)
    }
  }

  // Handle delete stock
  const handleDelete = async (stock: any) => {
    if (confirm(`Are you sure you want to delete stock entry for ${stock.model}${stock.color ? ` (${stock.color})` : ""}?`)) {
      try {
        await deleteTonerStock(stock.id)
        toast.success("Stock Deleted", {
          description: `Stock entry for ${stock.model} has been removed.`,
          duration: 3000,
        })
      } catch (error) {
        toast.error("Error", {
          description: "Failed to delete stock entry. Please try again.",
        })
      }
    }
  }

  if (loading) {
    return (
      <SidebarInset className="h-full bg-white">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Toner Stock</h1>
            <p className="text-xs text-muted-foreground">View toner inventory levels</p>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading toner stock...</p>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className="h-full bg-white">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-lg font-semibold">Toner Stock</h1>
          <p className="text-xs text-muted-foreground">View toner inventory levels</p>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Toner Inventory</h2>
          </div>
        </div>

        {/* Edit Stock Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Toner Stock</DialogTitle>
              <DialogDescription>
                Update stock details for {editStock?.model}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Toner Model</Label>
                  <Input
                    id="model"
                    value={editStock?.model || ""}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color/Type</Label>
                  <Input
                    id="color"
                    value={editStock?.color || "B&W"}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={editFormData.currentStock}
                    onChange={(e) => setEditFormData({ ...editFormData, currentStock: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={editFormData.lowStockThreshold}
                    onChange={(e) => setEditFormData({ ...editFormData, lowStockThreshold: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printer">Assigned Printer</Label>
                  <Select
                    value={editFormData.printerId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, printerId: value })}
                  >
                    <SelectTrigger id="printer">
                      <SelectValue placeholder="Select printer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {printers.map((printer) => (
                        <SelectItem key={printer.id} value={printer.id}>
                          {printer.assetNumber || printer.serialNumber} - {printer.assignedTo || "Unassigned"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditStock(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Stock
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {lowStockToners.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Stock Alert:</strong> {lowStockToners.length} toner model(s) are running low on stock.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl bg-gradient-to-b from-white to-blue-50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Current Stock Levels</CardTitle>
            <CardDescription>Real-time toner inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            {tonerStock.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No toner stock records found.</p>
                <p className="text-sm mt-2">Start by receiving toner items to track inventory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="font-semibold border-r border-dashed border-gray-200">Toner Model</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200">Color/Type</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200">Printer</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200">Model Number</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200 text-center">Current Stock</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200 text-center">Low Stock Threshold</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200 text-center">Status</TableHead>
                      <TableHead className="font-semibold border-r border-dashed border-gray-200 text-center">Last Updated</TableHead>
                      <TableHead className="font-semibold text-center w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tonerStock.map((stock) => {
                      const isLowStock = stock.currentStock <= stock.lowStockThreshold
                      return (
                        <TableRow key={stock.id} className="hover:bg-blue-50/50">
                          <TableCell className="font-medium border-r border-dashed border-gray-200">{stock.model}</TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            {stock.color ? (
                              <Badge variant="outline" className="capitalize">
                                {stock.color}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">B&W</span>
                            )}
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200 text-sm">
                            {getPrinterDisplay(stock.printerId, stock.printerName)}
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200 text-sm">
                            <span className="text-gray-700">{getPrinterModelNumber(stock.printerId)}</span>
                          </TableCell>
                          <TableCell className="text-center border-r border-dashed border-gray-200">
                            <span className={`font-semibold ${isLowStock ? "text-red-600" : "text-green-600"}`}>
                              {stock.currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center border-r border-dashed border-gray-200">
                            {stock.lowStockThreshold}
                          </TableCell>
                          <TableCell className="text-center border-r border-dashed border-gray-200">
                            {isLowStock ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600 flex items-center gap-1 w-fit mx-auto">
                                <CheckCircle className="h-3 w-3" />
                                In Stock
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground border-r border-dashed border-gray-200">
                            {new Date(stock.lastUpdated).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(stock)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(stock)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(stock)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {tonerStock.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Models</p>
                  <p className="text-3xl font-bold text-blue-600">{tonerStock.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Units</p>
                  <p className="text-3xl font-bold text-green-600">
                    {tonerStock.reduce((sum, stock) => sum + stock.currentStock, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{lowStockToners.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarInset>
  )
}

