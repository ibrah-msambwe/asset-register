"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export type DeviceType = "Computer" | "Laptop" | "Printer" | "Scanner" | "SIM Card" | "Office Phone" | "Router" | "Pocket Wifi" | "UPS"
export type DeviceStatus = "Active" | "Available" | "Maintenance" | "Inactive"

export interface Device {
  id: string
  assetNumber?: string
  type: DeviceType
  serialNumber: string
  modelNumber?: string
  assignedTo: string
  status: DeviceStatus
  dateAssigned: string | null
  notes?: string
  department?: string
  warranty?: string
}

interface DeviceContextType {
  devices: Device[]
  loading: boolean
  error: string | null
  isUsingMockData: boolean
  needsTableSetup: boolean
  addDevice: (device: Omit<Device, "id">) => Promise<void>
  updateDevice: (id: string, device: Partial<Device>) => Promise<void>
  deleteDevice: (id: string) => Promise<void>
  getDevicesByType: (type: DeviceType) => Device[]
  getDevicesByStatus: (status: DeviceStatus) => Device[]
  getDevicesByEmployee: (employeeName: string) => Device[]
  getEmployeeList: () => string[]
  getDeviceCount: () => number
  getDeviceCountByType: (type: DeviceType) => number
  getDeviceCountByStatus: (status: DeviceStatus) => number
  getEmployeeDeviceCount: (employeeName: string) => number
  refreshDevices: () => Promise<void>
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined)

// Sample initial data for when Supabase is not configured or table doesn't exist
const initialDevices: Device[] = [
  {
    id: "1",
    assetNumber: "HD0001",
    type: "Computer",
    serialNumber: "COMP-001-2024",
    modelNumber: "OptiPlex 7090",
    assignedTo: "John Doe",
    status: "Active",
    dateAssigned: "2024-01-15",
    notes: "Main workstation - Dell OptiPlex 7090",
  },
  {
    id: "2",
    assetNumber: "HD0002",
    type: "Printer",
    serialNumber: "PRNT-002-2024",
    modelNumber: "LaserJet Pro",
    assignedTo: "Jane Smith",
    status: "Active",
    dateAssigned: "2024-01-20",
    notes: "Color laser printer - HP LaserJet Pro",
  },
  {
    id: "3",
    assetNumber: "HD0003",
    type: "Scanner",
    serialNumber: "SCAN-003-2024",
    assignedTo: "John Doe",
    status: "Active",
    dateAssigned: "2024-01-10",
    notes: "Document scanner - Canon imageFORMULA",
  },
  {
    id: "4",
    assetNumber: "HD0004",
    type: "SIM Card",
    serialNumber: "SIM-004-2024",
    assignedTo: "Sarah Wilson",
    status: "Active",
    dateAssigned: "2024-01-25",
    notes: "Company phone SIM - MTN Corporate",
  },
  {
    id: "5",
    assetNumber: "HD0005",
    type: "Office Phone",
    serialNumber: "PHONE-005-2024",
    assignedTo: "John Doe",
    status: "Maintenance",
    dateAssigned: "2024-01-12",
    notes: "Desk phone - needs new battery",
  },
  {
    id: "6",
    assetNumber: "HD0006",
    type: "Computer",
    serialNumber: "COMP-006-2024",
    assignedTo: "",
    status: "Available",
    dateAssigned: null,
    notes: "Spare laptop - Lenovo ThinkPad",
  },
  {
    id: "7",
    assetNumber: "HD0007",
    type: "Printer",
    serialNumber: "PRNT-007-2024",
    assignedTo: "Michael Brown",
    status: "Active",
    dateAssigned: "2024-02-01",
    notes: "Black and white printer - Brother HL-L2350DW",
  },
  {
    id: "8",
    assetNumber: "HD0008",
    type: "Scanner",
    serialNumber: "SCAN-008-2024",
    assignedTo: "",
    status: "Available",
    dateAssigned: null,
    notes: "Portable scanner - Epson WorkForce",
  },
  {
    id: "9",
    assetNumber: "HD0009",
    type: "Pocket Wifi",
    serialNumber: "POCKET-009-2024",
    modelNumber: "Huawei E5577",
    assignedTo: "Alice Blue",
    status: "Active",
    dateAssigned: "2024-02-10",
    notes: "Mobile internet device - Huawei E5577",
  },
]

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [needsTableSetup, setNeedsTableSetup] = useState(false)

  const supabaseConfigured = isSupabaseConfigured()
  const supabase = createSupabaseClient()

  // Map database fields to our frontend model
  const mapDbDeviceToDevice = (dbDevice: any): Device => ({
    id: dbDevice.id,
    assetNumber: dbDevice.asset_number || undefined,
    type: dbDevice.type as DeviceType,
    serialNumber: dbDevice.serial_number,
    modelNumber: dbDevice.model_number,
    assignedTo: dbDevice.assigned_to || "",
    status: dbDevice.status as DeviceStatus,
    dateAssigned: dbDevice.date_assigned,
    notes: dbDevice.notes,
    department: dbDevice.department || "",
    warranty: dbDevice.warranty || "",
  })

  // Generate next asset number (HD0001, HD0002, etc. up to HD1000) - checks all devices to avoid duplicates
  const generateNextAssetNumber = async (): Promise<string> => {
    try {
      // Collect all existing asset numbers from both state and database
      const existingNumbers: number[] = []

      // Get numbers from current devices state
      devices.forEach(d => {
        if (d.assetNumber && d.assetNumber.startsWith('HD')) {
          const match = d.assetNumber.match(/HD(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > 0 && num <= 1000) {
              existingNumbers.push(num)
            }
          }
        }
      })

      // Query database for all asset numbers to ensure no duplicates
      if (supabaseConfigured && !isUsingMockData && !needsTableSetup) {
        try {
          const { data, error } = await supabase
            .from("devices")
            .select("asset_number")

          if (!error && data) {
            data.forEach((item: any) => {
              if (item.asset_number && item.asset_number.startsWith('HD')) {
                const match = item.asset_number.match(/HD(\d+)/)
                if (match) {
                  const num = parseInt(match[1], 10)
                  if (num > 0 && num <= 1000 && !existingNumbers.includes(num)) {
                    existingNumbers.push(num)
                  }
                }
              }
            })
          }
        } catch (dbErr) {
          console.error("Error fetching asset numbers from database:", dbErr)
        }
      }

      // Find the maximum number and generate next (up to 1000)
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
      let nextNumber = maxNumber + 1
      
      // Ensure we don't exceed 1000
      if (nextNumber > 1000) {
        // Find the first available number below 1000
        for (let i = 1; i <= 1000; i++) {
          if (!existingNumbers.includes(i)) {
            nextNumber = i
            break
          }
        }
        // If all numbers 1-1000 are taken, throw error
        if (nextNumber > 1000) {
          throw new Error("Maximum asset number limit (HD1000) reached. Please contact administrator.")
        }
      }
      
      return `HD${String(nextNumber).padStart(4, '0')}`
    } catch (err) {
      console.error("Error generating asset number:", err)
      // Fallback: generate based on device count
      const count = devices.length
      const nextNum = Math.min(count + 1, 1000)
      return `HD${String(nextNum).padStart(4, '0')}`
    }
  }

  // Assign asset numbers to devices that don't have them
  const assignMissingAssetNumbers = async (deviceList: Device[]): Promise<Device[]> => {
    const devicesNeedingNumbers = deviceList.filter(d => !d.assetNumber || d.assetNumber.trim() === "")
    
    if (devicesNeedingNumbers.length === 0) {
      return deviceList
    }

    // Get all existing asset numbers from current list
    const existingNumbers: number[] = []
    deviceList.forEach(d => {
      if (d.assetNumber && d.assetNumber.startsWith('HD')) {
        const match = d.assetNumber.match(/HD(\d+)/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (!existingNumbers.includes(num)) {
            existingNumbers.push(num)
          }
        }
      }
    })

    // Query database for all asset numbers to ensure no duplicates
    if (supabaseConfigured && !isUsingMockData && !needsTableSetup) {
      try {
        const { data } = await supabase
          .from("devices")
          .select("asset_number")

        if (data) {
          data.forEach((item: any) => {
            if (item.asset_number && item.asset_number.startsWith('HD')) {
              const match = item.asset_number.match(/HD(\d+)/)
              if (match) {
                const num = parseInt(match[1], 10)
                if (!existingNumbers.includes(num)) {
                  existingNumbers.push(num)
                }
              }
            }
          })
        }
      } catch (err) {
        console.error("Error fetching asset numbers:", err)
      }
    }

    // Assign numbers to devices that need them (up to 1000)
    let nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
    const updatePromises: Promise<any>[] = []
    const usedNumbers = new Set(existingNumbers)
    
    const updatedDevices = deviceList.map(device => {
      if (!device.assetNumber || device.assetNumber.trim() === "") {
        // Find next available number (1-1000)
        nextNumber++
        while (usedNumbers.has(nextNumber) && nextNumber <= 1000) {
          nextNumber++
        }
        
        if (nextNumber > 1000) {
          // Find first available number below 1000
          for (let i = 1; i <= 1000; i++) {
            if (!usedNumbers.has(i)) {
              nextNumber = i
              break
            }
          }
        }
        
        if (nextNumber > 1000) {
          console.error("Cannot assign asset number: limit reached")
          return device // Return device without asset number if limit reached
        }
        
        usedNumbers.add(nextNumber)
        const newAssetNumber = `HD${String(nextNumber).padStart(4, '0')}`
        
        // Update in database if configured
        if (supabaseConfigured && !isUsingMockData && !needsTableSetup) {
          const updatePromise = supabase
            .from("devices")
            .update({ asset_number: newAssetNumber })
            .eq("id", device.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating asset number for device ${device.id}:`, error)
              } else {
                console.log(`Assigned asset number ${newAssetNumber} to device ${device.id}`)
              }
            })
          updatePromises.push(updatePromise)
        }
        
        return { ...device, assetNumber: newAssetNumber }
      }
      return device
    })

    // Wait for all database updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    return updatedDevices
  }

  // Map our frontend model to database fields
  const mapDeviceToDbDevice = (device: Partial<Device>) => {
    const dbDevice: any = {}
    if (device.assetNumber !== undefined) dbDevice.asset_number = device.assetNumber || null
    if (device.type !== undefined) dbDevice.type = device.type
    if (device.serialNumber !== undefined) dbDevice.serial_number = device.serialNumber
    if (device.modelNumber !== undefined) dbDevice.model_number = device.modelNumber
    if (device.assignedTo !== undefined) dbDevice.assigned_to = device.assignedTo || null
    if (device.status !== undefined) dbDevice.status = device.status
    if (device.dateAssigned !== undefined) dbDevice.date_assigned = device.dateAssigned
    if (device.notes !== undefined) dbDevice.notes = device.notes
    if (device.department !== undefined) dbDevice.department = device.department || null
    if (device.warranty !== undefined) dbDevice.warranty = device.warranty || null
    return dbDevice
  }

  // Check if the error indicates missing table
  const isTableMissingError = (error: any) => {
    return (
      error?.message?.includes('relation "public.devices" does not exist') ||
      error?.message?.includes('table "devices" does not exist') ||
      error?.code === "PGRST116"
    )
  }

  // Fetch devices from Supabase or use mock data
  const fetchDevices = async () => {
    try {
      setLoading(true)
      setNeedsTableSetup(false)

      if (!supabaseConfigured) {
        // Use mock data when Supabase is not configured
        console.log("Using mock data - Supabase not configured")
        setDevices(initialDevices)
        setIsUsingMockData(true)
        setError(null)
        return
      }

      const { data, error } = await supabase.from("devices").select("*")

      if (error) {
        if (isTableMissingError(error)) {
          // Silently use mock data when table doesn't exist
          console.log("Database table not found - using mock data")
          setDevices(initialDevices)
          setIsUsingMockData(true)
          setNeedsTableSetup(true)
          setError(null) // Don't show error to user
          return
        }
        throw error
      }

      const mappedDevices = data.map(mapDbDeviceToDevice)
      // Assign asset numbers to devices that don't have them
      const devicesWithAssetNumbers = await assignMissingAssetNumbers(mappedDevices)
      setDevices(devicesWithAssetNumbers)
      setIsUsingMockData(false)
      setNeedsTableSetup(false)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching devices:", err)

      // Fallback to mock data on any error
      console.log("Falling back to mock data due to error:", err.message)
      setDevices(initialDevices)
      setIsUsingMockData(true)

      if (isTableMissingError(err)) {
        setNeedsTableSetup(true)
        setError(null) // Don't show error to user for table setup
      } else {
        setError(`Database connection failed. Using demo data.`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load devices on mount
  useEffect(() => {
    fetchDevices()

    // Set up real-time subscription only if Supabase is configured and table exists
    if (supabaseConfigured && !needsTableSetup) {
      const subscription = supabase
        .channel("devices-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => {
          fetchDevices()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [supabaseConfigured, needsTableSetup])

  const refreshDevices = async () => {
    await fetchDevices()
  }

  const addDevice = async (device: Omit<Device, "id">) => {
    try {
      setLoading(true)

      // Generate asset number if not provided
      const assetNumber = device.assetNumber || await generateNextAssetNumber()
      const deviceWithAsset = { ...device, assetNumber }

      if (!supabaseConfigured || isUsingMockData || needsTableSetup) {
        // Add to mock data
        const newDevice = {
          ...deviceWithAsset,
          id: Math.random().toString(36).substring(2, 9),
        }
        setDevices((prev) => [...prev, newDevice])
        setError(null)
        return
      }

      const dbDevice = mapDeviceToDbDevice(deviceWithAsset)
      const { data, error } = await supabase.from("devices").insert(dbDevice).select()

      if (error) {
        if (isTableMissingError(error)) {
          // Silently fall back to mock data
          setNeedsTableSetup(true)
          const newDevice = {
            ...deviceWithAsset,
            id: Math.random().toString(36).substring(2, 9),
          }
          setDevices((prev) => [...prev, newDevice])
          setError(null)
          return
        }
        throw error
      }

      if (data && data[0]) {
        const newDevice = mapDbDeviceToDevice(data[0])
        setDevices((prev) => [...prev, newDevice])
      }

      setError(null)
    } catch (err: any) {
      console.error("Error adding device:", err)
      setError(err.message || "Failed to add device")
    } finally {
      setLoading(false)
    }
  }

  const updateDevice = async (id: string, updatedDevice: Partial<Device>) => {
    try {
      setLoading(true)

      if (!supabaseConfigured || isUsingMockData || needsTableSetup) {
        // Update mock data
        setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, ...updatedDevice } : device)))
        setError(null)
        return
      }

      const dbDevice = mapDeviceToDbDevice(updatedDevice)
      const { error } = await supabase.from("devices").update(dbDevice).eq("id", id)

      if (error) {
        if (isTableMissingError(error)) {
          // Silently fall back to mock data
          setNeedsTableSetup(true)
          setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, ...updatedDevice } : device)))
          setError(null)
          return
        }
        throw error
      }

      setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, ...updatedDevice } : device)))
      setError(null)
    } catch (err: any) {
      console.error("Error updating device:", err)
      setError(err.message || "Failed to update device")
    } finally {
      setLoading(false)
    }
  }

  const deleteDevice = async (id: string) => {
    try {
      setLoading(true)

      if (!supabaseConfigured || isUsingMockData || needsTableSetup) {
        // Delete from mock data
        setDevices((prev) => prev.filter((device) => device.id !== id))
        setError(null)
        return
      }

      const { error } = await supabase.from("devices").delete().eq("id", id)

      if (error) {
        if (isTableMissingError(error)) {
          // Silently fall back to mock data
          setNeedsTableSetup(true)
          setDevices((prev) => prev.filter((device) => device.id !== id))
          setError(null)
          return
        }
        throw error
      }

      setDevices((prev) => prev.filter((device) => device.id !== id))
      setError(null)
    } catch (err: any) {
      console.error("Error deleting device:", err)
      setError(err.message || "Failed to delete device")
    } finally {
      setLoading(false)
    }
  }

  const getDevicesByType = (type: DeviceType) => {
    const normalizedType = type.trim().toLowerCase();
    return devices.filter((device) => device.type && device.type.trim().toLowerCase() === normalizedType);
  }

  const getDevicesByStatus = (status: DeviceStatus) => {
    return devices.filter((device) => device.status === status)
  }

  const getDevicesByEmployee = (employeeName: string) => {
    return devices.filter((device) => device.assignedTo === employeeName)
  }

  const getEmployeeList = () => {
    const employees = devices
      .filter((device) => device.assignedTo && device.assignedTo.trim() !== "")
      .map((device) => device.assignedTo)
    return [...new Set(employees)].sort()
  }

  const getDeviceCount = () => devices.length

  const getDeviceCountByType = (type: DeviceType) => {
    const normalizedType = type.trim().toLowerCase();
    return devices.filter((device) => device.type && device.type.trim().toLowerCase() === normalizedType).length;
  }

  const getDeviceCountByStatus = (status: DeviceStatus) => {
    return devices.filter((device) => device.status === status).length
  }

  const getEmployeeDeviceCount = (employeeName: string) => {
    return devices.filter((device) => device.assignedTo === employeeName).length
  }

  return (
    <DeviceContext.Provider
      value={{
        devices,
        loading,
        error,
        isUsingMockData,
        needsTableSetup,
        addDevice,
        updateDevice,
        deleteDevice,
        getDevicesByType,
        getDevicesByStatus,
        getDevicesByEmployee,
        getEmployeeList,
        getDeviceCount,
        getDeviceCountByType,
        getDeviceCountByStatus,
        getEmployeeDeviceCount,
        refreshDevices,
      }}
    >
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevices() {
  const context = useContext(DeviceContext)
  if (context === undefined) {
    throw new Error("useDevices must be used within a DeviceProvider")
  }
  return context
}
