"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Package, Save, Loader2, Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { useInventory, type ItemType, type TonerModel, type TonerType, type TonerColor } from "@/context/inventory-context"
import { useDevices } from "@/context/device-context"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ReceiveItemsPage() {
  const router = useRouter()
  const { addReceivedItem, getPrinters, receivedItems, updateReceivedItem, deleteReceivedItem } = useInventory()
  const { devices } = useDevices()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const printers = getPrinters()
  const [formData, setFormData] = useState({
    itemType: "" as ItemType | "",
    tonerModel: "" as TonerModel | "",
    tonerType: "" as TonerType | "",
    tonerColor: "" as TonerColor | "",
    printerId: "",
    quantity: "",
    supplier: "",
    receivedDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    if (!formData.itemType) {
      setFormError("Item type is required.")
      setLoading(false)
      return
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setFormError("Quantity must be greater than 0.")
      setLoading(false)
      return
    }
    if (!formData.supplier) {
      setFormError("Supplier is required.")
      setLoading(false)
      return
    }
    if (formData.itemType === "Toner") {
      if (!formData.tonerModel) {
        setFormError("Toner model is required for toner items.")
        setLoading(false)
        return
      }
      if (!formData.tonerType) {
        setFormError("Toner type (Black & White or Color) is required.")
        setLoading(false)
        return
      }
      if (formData.tonerType === "Color" && !formData.tonerColor) {
        setFormError("Toner color is required for color toners.")
        setLoading(false)
        return
      }
      if (!formData.printerId) {
        setFormError("Printer selection is required for toner items.")
        setLoading(false)
        return
      }
    }

    try {
      const editingId = (window as any).editingReceivedItemId
      const selectedPrinter = printers.find((p) => p.id === formData.printerId)
      const printerDevice = selectedPrinter ? devices.find((d) => d.id === selectedPrinter.id) : undefined
      const itemData = {
        itemType: formData.itemType as ItemType,
        tonerModel: formData.itemType === "Toner" ? (formData.tonerModel as TonerModel) : undefined,
        tonerType: formData.itemType === "Toner" ? (formData.tonerType as TonerType) : undefined,
        tonerColor: formData.itemType === "Toner" && formData.tonerType === "Color" ? (formData.tonerColor as TonerColor) : undefined,
        printerId: formData.itemType === "Toner" ? formData.printerId : undefined,
        printerName: formData.itemType === "Toner" && selectedPrinter ? `${selectedPrinter.assetNumber || selectedPrinter.serialNumber} - ${selectedPrinter.assignedTo || "Unassigned"}${printerDevice?.modelNumber ? ` (${printerDevice.modelNumber})` : ""}` : undefined,
        quantity: parseInt(formData.quantity),
        supplier: formData.supplier,
        receivedDate: formData.receivedDate,
        notes: formData.notes || undefined,
      }

      if (editingId) {
        await updateReceivedItem(editingId, itemData)
        toast.success("Item updated successfully! ✏️", {
          description: `${formData.quantity} ${formData.itemType}(s) have been updated.`,
          duration: 4000,
        })
        delete (window as any).editingReceivedItemId
      } else {
        await addReceivedItem(itemData)
        toast.success("Items received successfully! 📦", {
          description: `${formData.quantity} ${formData.itemType}(s) have been added to inventory.`,
          duration: 4000,
        })
      }

      setDialogOpen(false) // Close dialog after successful submission

      // Reset form only if not editing
      if (!(window as any).editingReceivedItemId) {
        setFormData({
          itemType: "" as ItemType | "",
          tonerModel: "" as TonerModel | "",
          tonerType: "" as TonerType | "",
          tonerColor: "" as TonerColor | "",
          printerId: "",
          quantity: "",
          supplier: "",
          receivedDate: new Date().toISOString().split("T")[0],
          notes: "",
        })
      }
    } catch (error) {
      setFormError("Error receiving items.")
      console.error("Error receiving items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "itemType" && value !== "Toner") {
        updated.tonerModel = "" as TonerModel | ""
        updated.tonerType = "" as TonerType | ""
        updated.tonerColor = "" as TonerColor | ""
        updated.printerId = ""
      }
      if (field === "tonerType" && value !== "Color") {
        updated.tonerColor = "" as TonerColor | ""
      }
      return updated
    })
  }

  // Filter received items for table
  const filteredReceivedItems = receivedItems.filter((item) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      item.itemType.toLowerCase().includes(searchLower) ||
      item.tonerModel?.toLowerCase().includes(searchLower) ||
      item.supplier.toLowerCase().includes(searchLower) ||
      item.printerName?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower)
    )
  })

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return dateString
    }
  }

  // Get printer details with model number from devices
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

  return (
    <SidebarInset className="h-full bg-white">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-lg font-semibold">Receive Items</h1>
          <p className="text-xs text-muted-foreground">Record incoming inventory items</p>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 bg-white">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Receive Items
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  Receive Items
                </DialogTitle>
                <DialogDescription>
                  Record new items received into inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start mt-4">
              {formError && <div className="text-red-600 text-sm mb-2 col-span-full">{formError}</div>}

              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="itemType">Item Type *</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) => handleChange("itemType", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toner">Toner</SelectItem>
                    <SelectItem value="Keyboard">Keyboard</SelectItem>
                    <SelectItem value="Mouse">Mouse</SelectItem>
                    <SelectItem value="Cable">Cable</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.itemType === "Toner" && (
                <>
                  <div className="flex flex-col gap-1 w-full">
                    <Label htmlFor="tonerModel">Toner Model *</Label>
                    <Input
                      id="tonerModel"
                      value={formData.tonerModel}
                      onChange={(e) => handleChange("tonerModel", e.target.value)}
                      placeholder="Enter toner model (e.g., HP 85A, Canon 303)"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Type the toner model name (e.g., HP 85A, Canon 303, Brother TN-630)
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <Label htmlFor="tonerType">Toner Type *</Label>
                    <Select
                      value={formData.tonerType}
                      onValueChange={(value) => handleChange("tonerType", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select toner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Black & White">Black & White</SelectItem>
                        <SelectItem value="Color">Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.tonerType === "Color" && (
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="tonerColor">Toner Color *</Label>
                      <Select
                        value={formData.tonerColor}
                        onValueChange={(value) => handleChange("tonerColor", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select toner color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Black">Black</SelectItem>
                          <SelectItem value="Cyan">Cyan</SelectItem>
                          <SelectItem value="Magenta">Magenta</SelectItem>
                          <SelectItem value="Yellow">Yellow</SelectItem>
                          <SelectItem value="Color Set">Color Set (All 4 colors)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 w-full">
                    <Label htmlFor="printerId">Assigned Printer *</Label>
                    <Select
                      value={formData.printerId}
                      onValueChange={(value) => handleChange("printerId", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select printer from assets" />
                      </SelectTrigger>
                      <SelectContent>
                        {printers.length === 0 ? (
                          <SelectItem value="" disabled>No printers found in assets</SelectItem>
                        ) : (
                          printers.map((printer) => (
                            <SelectItem key={printer.id} value={printer.id}>
                              {printer.assetNumber || printer.serialNumber} - {printer.assignedTo || "Unassigned"} {printer.modelNumber ? `(${printer.modelNumber})` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select printer from asset database
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="supplier">Supplier *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="receivedDate">Received Date *</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleChange("receivedDate", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1 w-full md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>

                <DialogFooter className="col-span-full pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2 text-base font-semibold rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Record Receipt
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Received Items History Table */}
        <Card className="border-none shadow-xl bg-gradient-to-b from-white to-blue-50 rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Received Items History</CardTitle>
                <CardDescription>View all received items and their details</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search received items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReceivedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No received items found</p>
                <p className="text-sm mt-2">
                  {searchTerm ? "Try adjusting your search terms" : "Start receiving items to see them here"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Item Type</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Toner Details</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Quantity</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Supplier</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Printer</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Received Date</TableHead>
                      <TableHead className="border-r border-dashed border-gray-200 font-semibold">Notes</TableHead>
                      <TableHead className="font-semibold text-center w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivedItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-blue-50/50">
                        <TableCell className="border-r border-dashed border-gray-200">
                          <Badge variant="outline" className="font-medium">
                            {item.itemType}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-dashed border-gray-200">
                          {item.itemType === "Toner" ? (
                            <div className="space-y-1">
                              {item.tonerModel && (
                                <div className="font-medium text-sm">{item.tonerModel}</div>
                              )}
                              {item.tonerType && (
                                <Badge variant="secondary" className="text-xs mr-1">
                                  {item.tonerType}
                                </Badge>
                              )}
                              {item.tonerColor && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.tonerColor}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="border-r border-dashed border-gray-200">
                          <span className="font-semibold text-blue-600">{item.quantity}</span>
                        </TableCell>
                        <TableCell className="border-r border-dashed border-gray-200">
                          <span className="font-medium">{item.supplier}</span>
                        </TableCell>
                        <TableCell className="border-r border-dashed border-gray-200">
                          <span className="text-sm">{getPrinterDisplay(item.printerId, item.printerName)}</span>
                        </TableCell>
                        <TableCell className="border-r border-dashed border-gray-200">
                          <span className="text-sm">{formatDate(item.receivedDate)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{item.notes || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                // View action - could open a dialog with full details
                                toast.info("View details", {
                                  description: `${item.itemType} - Quantity: ${item.quantity}, Supplier: ${item.supplier}`,
                                })
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setFormData({
                                  itemType: item.itemType as ItemType | "",
                                  tonerModel: item.tonerModel || ("" as TonerModel | ""),
                                  tonerType: item.tonerType || ("" as TonerType | ""),
                                  tonerColor: item.tonerColor || ("" as TonerColor | ""),
                                  printerId: item.printerId || "",
                                  quantity: item.quantity.toString(),
                                  supplier: item.supplier,
                                  receivedDate: item.receivedDate,
                                  notes: item.notes || "",
                                })
                                setDialogOpen(true)
                                ;(window as any).editingReceivedItemId = item.id
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete this ${item.itemType} item?`)) {
                                    await deleteReceivedItem(item.id)
                                    toast.success("Item deleted successfully! 🗑️", {
                                      description: `${item.itemType} item has been removed.`,
                                    })
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

