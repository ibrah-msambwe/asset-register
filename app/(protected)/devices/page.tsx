"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDevices, type DeviceStatus } from "@/context/device-context"
import { Skeleton } from "@/components/ui/skeleton"
import { MockDataBanner } from "@/components/mock-data-banner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toTitleCase } from "@/lib/utils"

// Normalization function for device types
const normalizeDeviceType = (type: string) => {
  if (!type) return "Other";
  const key = type.trim().toLowerCase();
  switch (key) {
    case "computer":
    case "compuetr":
      return "Computer";
    case "laptop":
      return "Laptop";
    case "printer":
      return "Printer";
    case "scanner":
      return "Scanner";
    case "sim card":
      return "SIM Card";
    case "office phone":
      return "Office Phone";
    case "router":
      return "Router";
    case "pocket wifi":
      return "Pocket Wifi";
    case "ups":
      return "UPS";
    case "modem":
    case "mordem":
      return "Modem";
    case "tablet":
      return "Tablet";
    case "phone":
      return "Phone";
    case "server":
      return "Server";
    case "firewall":
      return "Firewall";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
}

// Helper to get all unique, normalized device types
const getAllDeviceTypes = (devices: any[]) => {
  const typeSet = new Set<string>()
  devices.forEach((d: any) => {
    if (d.type) {
      typeSet.add(normalizeDeviceType(d.type));
    }
  })
  return Array.from(typeSet)
}

export default function DevicesPage() {
  const { devices, deleteDevice, updateDevice, loading, error, isUsingMockData, needsTableSetup } = useDevices()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("serialNumber")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [devicesPerPage, setDevicesPerPage] = useState(20)

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      (device.assetNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.assignedTo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.department || "").toLowerCase().includes(searchTerm.toLowerCase())

    const normalizedType = normalizeDeviceType(device.type || "")
    const matchesType = filterType === "all" || normalizedType === filterType
    const matchesStatus = filterStatus === "all" || (device.status || "").toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesType && matchesStatus
  })

  const getDeviceValue = (device: typeof devices[number], key: string) => {
    switch (key) {
      case "assetNumber": return device.assetNumber || "";
      case "type": return device.type || "";
      case "serialNumber": return device.serialNumber || "";
      case "assignedTo": return device.assignedTo || "";
      case "status": return device.status || "";
      case "dateAssigned": return device.dateAssigned || "";
      case "modelNumber": return device.modelNumber || "";
      case "department": return device.department || "";
      case "warranty": return device.warranty || "";
      default: return "";
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const aValue = getDeviceValue(a, sortBy);
    const bValue = getDeviceValue(b, sortBy);
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  })

  const totalPages = Math.ceil(sortedDevices.length / devicesPerPage)
  const paginatedDevices = sortedDevices.slice((currentPage - 1) * devicesPerPage, currentPage * devicesPerPage)

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "Maintenance":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Maintenance</Badge>
      case "Available":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Available</Badge>
      case "Inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDeleteDevice = (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      setIsDeleting(confirmDeleteId)
      try {
        await deleteDevice(confirmDeleteId)
        toast.success("Device deleted successfully! 🤗", {
          description: "The device has been removed from the system.",
          duration: 3000,
        })
      } catch (error) {
        toast.error("Failed to delete device", {
          description: "Please try again later.",
        })
      } finally {
        setIsDeleting(null)
        setConfirmDeleteId(null)
      }
    }
  }

  const cancelDelete = () => setConfirmDeleteId(null)

  return (
    <SidebarInset className="h-full bg-white">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Devices</h1>
        <div className="ml-auto">
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/devices/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/devices/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Devices
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 bg-white min-h-[calc(100vh-4rem)]">
        <MockDataBanner isVisible={isUsingMockData} needsTableSetup={needsTableSetup} error={error} />

        {/* Search and Filter Controls */}
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="pb-2">
            <CardTitle>Device Management</CardTitle>
            <CardDescription>Manage and track all your organization's devices</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search asset numbers, devices, serial numbers, or assigned users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue placeholder="Device Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Devices</SelectItem>
                    {getAllDeviceTypes(devices).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px] bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error message - only show if not using mock data and not table setup issue */}
        {error && !isUsingMockData && !needsTableSetup && (
          <Card className="border-none shadow-md bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Devices Table */}
        <Card className="border-none shadow-md flex-1 bg-white">
          <CardContent className="p-0 bg-white">
            {/* Rows per page selector */}
            <div className="flex justify-end items-center p-4">
              <label htmlFor="rows-per-page" className="mr-2 text-sm text-gray-700">Rows per page:</label>
              <select
                id="rows-per-page"
                value={devicesPerPage}
                onChange={e => {
                  setDevicesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 20, 50, 100].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <Table className="font-inter shadow-md rounded-xl border-none bg-white">
              <TableHeader>
                <TableRow className="bg-blue-50 rounded-t-xl">
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Asset Number</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Device Type</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Serial Number</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Assigned To</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Department</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Warranty</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Status</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Date Assigned</TableHead>
                  <TableHead className="font-bold text-base px-5 py-3 border-r border-dashed border-gray-200">Model Number</TableHead>
                  <TableHead className="w-[50px] font-bold text-base px-5 py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {loading
                  ? // Loading skeleton rows
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i} className="bg-white">
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-28" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="border-r border-dashed border-gray-200">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </TableCell>
                        </TableRow>
                      ))
                  : paginatedDevices.map((device, idx) => (
                      <TableRow key={device.id} className={`transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} rounded-lg px-5 py-3`}>
                        <TableCell className="px-5 py-3 font-inter text-sm font-semibold text-blue-600 border-r border-dashed border-gray-200">{device.assetNumber || "Not Assigned"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.type ? toTitleCase(device.type) : "Not Available"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.serialNumber ? device.serialNumber : "Not Available"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.assignedTo ? toTitleCase(device.assignedTo) : "Not assigned"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.department ? toTitleCase(device.department) : "Not assigned"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.warranty && device.warranty.trim().toLowerCase() !== "" && device.warranty.trim().toLowerCase() !== "na" ? toTitleCase(device.warranty) : "Not Available"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.status ? getStatusBadge(device.status) : "Not Available"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.dateAssigned ? toTitleCase(device.dateAssigned) : "Not assigned"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm border-r border-dashed border-gray-200">{device.modelNumber ? toTitleCase(device.modelNumber) : "Not Available"}</TableCell>
                        <TableCell className="px-5 py-3 font-inter text-sm flex gap-2 items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/devices/edit/${device.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDevice(device.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  updateDevice(device.id, { ...device, status: "Inactive" })
                                }}
                                className="text-gray-600"
                              >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Mark as Inactive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!loading && paginatedDevices.length === 0 && (
          <Card className="border-none shadow-md bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 bg-white">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No devices match your current search and filter criteria.
              </p>
              <Button asChild>
                <Link href="/devices/add">Add New Device</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
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

        <Dialog open={!!confirmDeleteId} onOpenChange={cancelDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Device</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this device? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting !== null}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  )
}
