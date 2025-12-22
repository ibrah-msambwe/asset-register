"use client"

import { useState, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { useDevices } from "@/context/device-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toTitleCase } from "@/lib/utils"

export default function DeviceReportsPage() {
  const { devices } = useDevices()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [devicesPerPage, setDevicesPerPage] = useState(20)

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      (device.assetNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.modelNumber || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || device.type === filterType
    const matchesStatus = filterStatus === "all" || device.status === filterStatus
    const matchesDepartment = filterDepartment === "all" || device.department === filterDepartment

    // Date range filter
    let matchesDate = true
    if (device.dateAssigned) {
      const deviceDate = new Date(device.dateAssigned)
      if (startDate) {
        const start = new Date(startDate)
        if (deviceDate < start) matchesDate = false
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include the entire end date
        if (deviceDate > end) matchesDate = false
      }
    } else if (startDate || endDate) {
      matchesDate = false // If device has no date assigned and date filter is set, exclude it
    }

    return matchesSearch && matchesType && matchesStatus && matchesDepartment && matchesDate
  })

  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage)
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * devicesPerPage,
    currentPage * devicesPerPage
  )

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredDevices.length, currentPage, totalPages])

  const departments = Array.from(new Set(devices.map(device => device.department).filter(Boolean)))

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
      doc.text("Device Inventory Report", pageWidth / 2, 25, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Report Date: ${reportDate}`, pageWidth / 2, 35, { align: "center" })
      doc.text(`Report Time: ${reportTime}`, pageWidth / 2, 42, { align: "center" })
      doc.text(`Total Devices: ${filteredDevices.length}`, pageWidth / 2, 49, { align: "center" })
      
      let yPos = 56
      if (filterType !== "all") doc.text(`Device Type: ${filterType}`, pageWidth / 2, yPos++, { align: "center" })
      if (filterStatus !== "all") doc.text(`Status: ${filterStatus}`, pageWidth / 2, yPos++, { align: "center" })
      if (filterDepartment !== "all") doc.text(`Department: ${filterDepartment}`, pageWidth / 2, yPos++, { align: "center" })
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
          "Asset Number",
          "Device Type",
          "Serial Number",
          "Assigned To",
          "Department",
          "Warranty",
          "Status",
          "Date Assigned",
          "Model Number"
        ]],
        body: filteredDevices.map(device => [
          device.assetNumber || "Not Assigned",
          device.type ? toTitleCase(device.type) : "Not Available",
          device.serialNumber ? device.serialNumber : "Not Available",
          device.assignedTo ? toTitleCase(device.assignedTo) : "Not assigned",
          device.department ? toTitleCase(device.department) : "Not assigned",
          device.warranty && device.warranty.trim().toLowerCase() !== "" && device.warranty.trim().toLowerCase() !== "na" ? toTitleCase(device.warranty) : "Not Available",
          device.status ? toTitleCase(device.status) : "Not Available",
          device.dateAssigned ? toTitleCase(device.dateAssigned) : "Not assigned",
          device.modelNumber ? toTitleCase(device.modelNumber) : "Not Available"
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
      link.download = `hesu-device-inventory-report-${new Date().toISOString().split("T")[0]}.pdf`
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
        <h1 className="text-lg font-semibold">Device Inventory Report</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 w-full bg-white min-h-[calc(100vh-4rem)]">
        <Card className="border-none shadow-md bg-white w-full">
          <CardHeader>
            <CardTitle>Device Inventory Report</CardTitle>
            <CardDescription>View and export detailed device information</CardDescription>
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
                    placeholder="Search asset numbers, devices, serial numbers, or assigned users..."
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
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Device Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Computer">Computer</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Printer">Printer</SelectItem>
                      <SelectItem value="Scanner">Scanner</SelectItem>
                      <SelectItem value="SIM Card">SIM Card</SelectItem>
                      <SelectItem value="Office Phone">Office Phone</SelectItem>
                      <SelectItem value="Router">Router</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept || ""}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="rows-per-page" className="text-sm text-gray-700 font-medium">Rows per page:</label>
                  <select
                    id="rows-per-page"
                    value={devicesPerPage}
                    onChange={e => {
                      setDevicesPerPage(Number(e.target.value))
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
                  Showing {paginatedDevices.length > 0 ? (currentPage - 1) * devicesPerPage + 1 : 0} - {Math.min(currentPage * devicesPerPage, filteredDevices.length)} of {filteredDevices.length} devices
                </div>
              </div>

              <div className="rounded-md border shadow-sm overflow-hidden bg-white">
                <Table className="font-inter w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-blue-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100">
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[90px] border-r border-dashed border-gray-200">Asset #</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[100px] border-r border-dashed border-gray-200">Type</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[120px] border-r border-dashed border-gray-200">Serial #</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[130px] border-r border-dashed border-gray-200">Assigned To</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[110px] border-r border-dashed border-gray-200">Department</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[90px] border-r border-dashed border-gray-200">Warranty</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[100px] border-r border-dashed border-gray-200">Status</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[110px] border-r border-dashed border-gray-200">Date</TableHead>
                      <TableHead className="font-semibold text-xs px-2 py-3 text-gray-900 w-[120px]">Model</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No devices found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDevices.map((device, idx) => (
                        <TableRow 
                          key={String(device.id)} 
                          className={`transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <TableCell className="px-2 py-3 font-inter text-xs font-semibold text-blue-600 truncate border-r border-dashed border-gray-200">{device.assetNumber || "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.type ? toTitleCase(device.type) : "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.serialNumber || "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.assignedTo ? toTitleCase(device.assignedTo) : "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.department ? toTitleCase(device.department) : "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.warranty && device.warranty.trim().toLowerCase() !== "" && device.warranty.trim().toLowerCase() !== "na" ? toTitleCase(device.warranty) : "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs border-r border-dashed border-gray-200">
                            {device.status ? (
                              <Badge className={
                                device.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs px-1.5 py-0.5" :
                                device.status === "Maintenance" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs px-1.5 py-0.5" :
                                device.status === "Available" ? "bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs px-1.5 py-0.5" :
                                "bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs px-1.5 py-0.5"
                              }>
                                {toTitleCase(device.status)}
                              </Badge>
                            ) : "N/A"}
                          </TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate border-r border-dashed border-gray-200">{device.dateAssigned ? new Date(device.dateAssigned).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</TableCell>
                          <TableCell className="px-2 py-3 font-inter text-xs truncate">{device.modelNumber ? toTitleCase(device.modelNumber) : "N/A"}</TableCell>
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
                            className="px-3 py-1 rounded border text-sm font-medium bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
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
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
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
                            className="px-3 py-1 rounded border text-sm font-medium bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
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

