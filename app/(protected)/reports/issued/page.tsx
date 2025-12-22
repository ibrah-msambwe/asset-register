"use client"

import { useState, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { useInventory } from "@/context/inventory-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function IssuedItemsReportsPage() {
  const { issuedItems } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const filteredItems = issuedItems.filter(item => {
    const matchesSearch = !searchTerm || (() => {
      const searchLower = searchTerm.toLowerCase()
      return (
        item.itemType.toLowerCase().includes(searchLower) ||
        item.tonerModel?.toLowerCase().includes(searchLower) ||
        item.issuedTo.toLowerCase().includes(searchLower) ||
        item.printerName?.toLowerCase().includes(searchLower)
      )
    })()

    // Date range filter
    let matchesDate = true
    if (item.issuedDate) {
      const itemDate = new Date(item.issuedDate)
      if (startDate) {
        const start = new Date(startDate)
        if (itemDate < start) matchesDate = false
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (itemDate > end) matchesDate = false
      }
    }

    return matchesSearch && matchesDate
  })

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredItems.length, currentPage, totalPages])

  const exportToPDF = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const reportDate = new Date().toLocaleDateString()
      const reportTime = new Date().toLocaleTimeString()
      
      doc.setFontSize(20)
      doc.text("Hesu Investment Limited", pageWidth / 2, 15, { align: "center" })
      doc.setFontSize(16)
      doc.text("Issued Items Report", pageWidth / 2, 25, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Report Date: ${reportDate}`, pageWidth / 2, 35, { align: "center" })
      doc.text(`Report Time: ${reportTime}`, pageWidth / 2, 42, { align: "center" })
      doc.text(`Total Records: ${filteredItems.length}`, pageWidth / 2, 49, { align: "center" })
      
      let yPos = 56
      if (searchTerm) doc.text(`Search Term: ${searchTerm}`, pageWidth / 2, yPos++, { align: "center" })
      if (startDate || endDate) {
        const dateRange = startDate && endDate 
          ? `${startDate} to ${endDate}`
          : startDate 
            ? `From ${startDate}`
            : `Until ${endDate}`
        doc.text(`Date Range: ${dateRange}`, pageWidth / 2, yPos++, { align: "center" })
      }
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [[
          "Item Type",
          "Toner Model",
          "Toner Type",
          "Toner Color",
          "Quantity",
          "Issued To",
          "Printer",
          "Issue Date",
          "Notes"
        ]],
        body: filteredItems.map(item => [
          item.itemType,
          item.tonerModel || "N/A",
          item.tonerType || "N/A",
          item.tonerColor || "N/A",
          item.quantity.toString(),
          item.issuedTo,
          item.printerName || "N/A",
          new Date(item.issuedDate).toLocaleDateString(),
          item.notes || "N/A"
        ]),
        styles: { 
          fontSize: 9,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 10 },
        theme: 'grid',
        didDrawPage: function(data) {
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.5)
          doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.height - 20)
        }
      })
      
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Page ${i} of ${pageCount} - Generated on ${reportDate}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        )
      }

      const pdfBlob = doc.output('blob')
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hesu-issued-items-report-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setExportError(err.message || "Failed to export report")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <SidebarInset className="h-full bg-white">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Issued Items Report</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 w-full bg-white min-h-[calc(100vh-4rem)]">
        <Card className="border-none shadow-md bg-white w-full">
          <CardHeader>
            <CardTitle>Issued Items Report</CardTitle>
            <CardDescription>View and export issued items information</CardDescription>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            {exportError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search item type, toner model, issued to, or printer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full"
                    placeholder="Start Date"
                  />
                  <span className="self-center text-gray-500">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full"
                    placeholder="End Date"
                  />
                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartDate("")
                        setEndDate("")
                        setCurrentPage(1)
                      }}
                      className="whitespace-nowrap"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="rows-per-page" className="text-sm text-gray-700 font-medium">Rows per page:</label>
                  <select
                    id="rows-per-page"
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border rounded px-2 py-1 text-sm bg-white"
                  >
                    {[10, 20, 50, 100].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {paginatedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} issued items
                </div>
              </div>

              <div className="rounded-md border shadow-sm overflow-hidden bg-white">
                <Table className="font-inter w-full">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-orange-50 to-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100">
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Item Type</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Toner Model</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Toner Type</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Quantity</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Issued To</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Printer</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 border-r border-dashed border-gray-200">Issue Date</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No issued items found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedItems.map((item, idx) => (
                        <TableRow key={item.id} className={`transition hover:bg-orange-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <TableCell className="px-2 py-3 font-inter text-xs border-r border-dashed border-gray-200">
                            <Badge variant="outline" className="text-xs">{item.itemType}</Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{item.tonerModel || "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{item.tonerType || "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs font-semibold text-blue-600 border-r border-dashed border-gray-200">{item.quantity}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{item.issuedTo}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{item.printerName || "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{new Date(item.issuedDate).toLocaleDateString()}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate">{item.notes || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pagesToShow = 5
                      const half = Math.floor(pagesToShow / 2)
                      let start = Math.max(1, currentPage - half)
                      let end = Math.min(totalPages, start + pagesToShow - 1)
                      
                      if (end - start < pagesToShow - 1) {
                        start = Math.max(1, end - pagesToShow + 1)
                      }
                      
                      const pages = []
                      if (start > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-1 rounded border text-sm font-medium bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            1
                          </button>
                        )
                        if (start > 2) {
                          pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>)
                        }
                      }
                      
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-1 rounded border text-sm font-medium ${
                              currentPage === i
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                      
                      if (end < totalPages) {
                        if (end < totalPages - 1) {
                          pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>)
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-1 rounded border text-sm font-medium bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            {totalPages}
                          </button>
                        )
                      }
                      
                      return pages
                    })()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-500 ml-4">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={exportToPDF} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export to PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

