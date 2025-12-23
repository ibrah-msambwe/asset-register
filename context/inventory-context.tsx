"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"
import { useDevices } from "./device-context"

export type ItemType = "Toner" | "Keyboard" | "Mouse" | "Cable" | "Monitor" | "Other"
export type TonerModel = "HP 85A" | "HP 87A" | "HP 410A" | "Canon 303" | "Canon 305" | "Brother TN-630" | "Other" | string
export type TonerColor = "Black" | "Cyan" | "Magenta" | "Yellow" | "Color Set"
export type TonerType = "Black & White" | "Color"

export interface ReceivedItem {
  id: string
  itemType: ItemType
  tonerModel?: TonerModel
  tonerColor?: TonerColor
  tonerType?: TonerType
  printerId?: string
  printerName?: string
  quantity: number
  supplier: string
  receivedDate: string
  receivedBy?: string
  notes?: string
  createdAt?: string
}

export interface IssuedItem {
  id: string
  itemType: ItemType
  tonerModel?: TonerModel
  tonerColor?: TonerColor
  tonerType?: TonerType
  printerId?: string
  printerName?: string
  quantity: number
  issuedTo: string
  issuedDate: string
  assetId?: string
  notes?: string
  createdAt?: string
}

export interface TonerStock {
  id: string
  model: TonerModel
  color?: TonerColor
  printerId?: string
  printerName?: string
  currentStock: number
  lowStockThreshold: number
  lastUpdated: string
}

interface InventoryContextType {
  receivedItems: ReceivedItem[]
  issuedItems: IssuedItem[]
  tonerStock: TonerStock[]
  loading: boolean
  error: string | null
  isUsingMockData: boolean
  addReceivedItem: (item: Omit<ReceivedItem, "id">) => Promise<void>
  addIssuedItem: (item: Omit<IssuedItem, "id">) => Promise<void>
  updateReceivedItem: (id: string, item: Partial<ReceivedItem>) => Promise<void>
  updateIssuedItem: (id: string, item: Partial<IssuedItem>) => Promise<void>
  deleteReceivedItem: (id: string) => Promise<void>
  deleteIssuedItem: (id: string) => Promise<void>
  deleteTonerStock: (id: string) => Promise<void>
  createTonerStockEntry: (model: TonerModel, color?: TonerColor, printerId?: string, lowStockThreshold?: number) => Promise<void>
  updateTonerStock: (model: TonerModel, quantity: number, color?: TonerColor, printerId?: string) => Promise<void>
  updateTonerStockEntry: (id: string, updates: Partial<TonerStock>) => Promise<void>
  getTonerStockByModel: (model: TonerModel, color?: TonerColor, printerId?: string) => TonerStock | undefined
  getLowStockToners: () => TonerStock[]
  getEligibleUsersForItem: (itemType: ItemType) => string[]
  getPrinters: () => Array<{ id: string; assetNumber?: string; serialNumber: string; modelNumber?: string; assignedTo: string; notes?: string }>
  refreshInventory: () => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

const initialReceivedItems: ReceivedItem[] = [
  {
    id: "1",
    itemType: "Toner",
    tonerModel: "HP 85A",
    quantity: 20,
    supplier: "Tech Supplies Ltd",
    receivedDate: "2024-01-15",
    notes: "Bulk order for Q1",
  },
  {
    id: "2",
    itemType: "Keyboard",
    quantity: 10,
    supplier: "Office Depot",
    receivedDate: "2024-01-20",
    notes: "Wireless keyboards",
  },
]

const initialIssuedItems: IssuedItem[] = [
  {
    id: "1",
    itemType: "Toner",
    tonerModel: "HP 85A",
    quantity: 2,
    issuedTo: "John Doe",
    issuedDate: "2024-01-25",
    notes: "For office printer",
  },
]

const initialTonerStock: TonerStock[] = [
  {
    id: "1",
    model: "HP 85A",
    currentStock: 18,
    lowStockThreshold: 5,
    lastUpdated: "2024-01-25",
  },
  {
    id: "2",
    model: "HP 87A",
    currentStock: 12,
    lowStockThreshold: 5,
    lastUpdated: "2024-01-20",
  },
  {
    id: "3",
    model: "Canon 303",
    currentStock: 8,
    lowStockThreshold: 5,
    lastUpdated: "2024-01-18",
  },
]

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>(initialReceivedItems)
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>(initialIssuedItems)
  const [tonerStock, setTonerStock] = useState<TonerStock[]>(initialTonerStock)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(true)
  const { devices } = useDevices()

  const refreshInventory = async () => {
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured()) {
      setIsUsingMockData(true)
      setLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      const { data: receivedData, error: receivedError } = await supabase
        .from("received_items")
        .select("*")
        .order("received_date", { ascending: false })

      if (receivedError && receivedError.code !== "PGRST116") {
        throw receivedError
      }

      const { data: issuedData, error: issuedError } = await supabase
        .from("issued_items")
        .select("*")
        .order("issued_date", { ascending: false })

      if (issuedError && issuedError.code !== "PGRST116") {
        throw issuedError
      }

      const { data: stockData, error: stockError } = await supabase
        .from("toner_stock")
        .select("*")

      if (stockError && stockError.code !== "PGRST116") {
        throw stockError
      }

      if (receivedData) {
        setReceivedItems(
          receivedData.map((item: any) => ({
            id: item.id,
            itemType: item.item_type as ItemType,
            tonerModel: item.toner_model as TonerModel | undefined,
            tonerColor: item.toner_color as TonerColor | undefined,
            tonerType: item.toner_type as TonerType | undefined,
            printerId: item.printer_id || undefined,
            printerName: item.printer_name || undefined,
            quantity: item.quantity,
            supplier: item.supplier,
            receivedDate: item.received_date,
            receivedBy: item.received_by || undefined, // Will be undefined if column doesn't exist
            notes: item.notes || undefined,
            createdAt: item.created_at,
          }))
        )
      }

      if (issuedData) {
        setIssuedItems(
          issuedData.map((item) => ({
            id: item.id,
            itemType: item.item_type as ItemType,
            tonerModel: item.toner_model as TonerModel | undefined,
            tonerColor: item.toner_color as TonerColor | undefined,
            tonerType: item.toner_type as TonerType | undefined,
            printerId: item.printer_id || undefined,
            printerName: item.printer_name || undefined,
            quantity: item.quantity,
            issuedTo: item.issued_to,
            issuedDate: item.issued_date,
            assetId: item.asset_id || undefined,
            notes: item.notes || undefined,
            createdAt: item.created_at,
          }))
        )
      }

      if (stockData) {
        setTonerStock(
          stockData.map((stock) => ({
            id: stock.id,
            model: stock.model as TonerModel,
            color: stock.color as TonerColor | undefined,
            printerId: stock.printer_id || undefined,
            printerName: stock.printer_name || undefined,
            currentStock: stock.current_stock,
            lowStockThreshold: stock.low_stock_threshold,
            lastUpdated: stock.last_updated,
          }))
        )
      }

      setIsUsingMockData(false)
    } catch (err: any) {
      console.error("Error fetching inventory:", err)
      setError(err.message || "Failed to fetch inventory data")
      setIsUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshInventory()
  }, [])

  const addReceivedItem = async (item: Omit<ReceivedItem, "id">) => {
    const newItem: ReceivedItem = {
      ...item,
      id: Date.now().toString(),
    }

    setReceivedItems((prev) => [newItem, ...prev])

    // Update stock automatically when receiving toners (by model only - allows multiple assignments)
    // Stock is tracked by model only, so receiving updates the single stock entry for that model
    if (item.itemType === "Toner" && item.tonerModel) {
      await updateTonerStock(item.tonerModel as TonerModel, item.quantity, item.tonerColor, item.printerId)
    }

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // Build insert object, conditionally including received_by if it exists in the schema
      const insertData: any = {
        item_type: item.itemType,
        toner_model: item.tonerModel || null,
        toner_color: item.tonerColor || null,
        toner_type: item.tonerType || null,
        printer_id: item.printerId || null,
        printer_name: item.printerName || null,
        quantity: item.quantity,
        supplier: item.supplier,
        received_date: item.receivedDate,
        notes: item.notes || null,
      }
      
      // Only include received_by if it's provided (will fail gracefully if column doesn't exist)
      if (item.receivedBy !== undefined) {
        insertData.received_by = item.receivedBy || null
      }
      
      const { error, data } = await supabase.from("received_items").insert(insertData)

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      // Refresh inventory after successful insert
      await refreshInventory()
    } catch (err: any) {
      console.error("Error adding received item:", err)
      const errorMessage = err?.message || err?.details || err?.hint || JSON.stringify(err) || "Failed to add received item"
      setError(errorMessage)
      
      // If it's a column doesn't exist error, provide helpful message
      if (err?.code === "42703" || err?.message?.includes("column") || err?.message?.includes("does not exist")) {
        setError("Database column 'received_by' does not exist. Please run the migration: ALTER TABLE received_items ADD COLUMN received_by VARCHAR(255);")
      }
    }
  }

  const addIssuedItem = async (item: Omit<IssuedItem, "id">) => {
    const newItem: IssuedItem = {
      ...item,
      id: Date.now().toString(),
    }

    setIssuedItems((prev) => [newItem, ...prev])

    // Deduct from stock when issuing toners - find by model only (ignores printer assignment)
    // One toner model can be issued to multiple users/printers regardless of stock's printer assignment
    if (item.itemType === "Toner" && item.tonerModel) {
      const currentStock = getTonerStockByModel(item.tonerModel as TonerModel)
      if (currentStock) {
        // Check if there's enough stock
        if (currentStock.currentStock < item.quantity) {
          throw new Error(`Insufficient stock. Only ${currentStock.currentStock} units available for ${item.tonerModel}.`)
        }
        // Deduct from stock (model-only, allows multiple assignments to different users/printers)
        // Printer assignment in stock doesn't matter - any printer can be issued this toner model
        await updateTonerStock(item.tonerModel as TonerModel, -item.quantity, item.tonerColor, item.printerId)
      } else {
        console.warn(`No stock found for ${item.tonerModel}`)
        throw new Error(`No stock entry found for toner model: ${item.tonerModel}. Please add this toner to stock first.`)
      }
    }

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("issued_items").insert({
        item_type: item.itemType,
        toner_model: item.tonerModel || null,
        toner_color: item.tonerColor || null,
        toner_type: item.tonerType || null,
        printer_id: item.printerId || null,
        printer_name: item.printerName || null,
        quantity: item.quantity,
        issued_to: item.issuedTo,
        issued_date: item.issuedDate,
        asset_id: item.assetId || null,
        notes: item.notes || null,
      })

      if (error) throw error
      
      // Refresh inventory after successful insert
      await refreshInventory()
    } catch (err: any) {
      console.error("Error adding issued item:", err)
      setError(err.message || "Failed to add issued item")
    }
  }

  const updateReceivedItem = async (id: string, updates: Partial<ReceivedItem>) => {
    setReceivedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // Build update object, conditionally including received_by if it exists in the schema
      const updateData: any = {}
      if (updates.itemType !== undefined) updateData.item_type = updates.itemType
      if (updates.tonerModel !== undefined) updateData.toner_model = updates.tonerModel || null
      if (updates.tonerColor !== undefined) updateData.toner_color = updates.tonerColor || null
      if (updates.tonerType !== undefined) updateData.toner_type = updates.tonerType || null
      if (updates.printerId !== undefined) updateData.printer_id = updates.printerId || null
      if (updates.printerName !== undefined) updateData.printer_name = updates.printerName || null
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity
      if (updates.supplier !== undefined) updateData.supplier = updates.supplier
      if (updates.receivedDate !== undefined) updateData.received_date = updates.receivedDate
      if (updates.notes !== undefined) updateData.notes = updates.notes || null
      
      // Only include received_by if it's provided (will fail gracefully if column doesn't exist)
      if (updates.receivedBy !== undefined) {
        updateData.received_by = updates.receivedBy || null
      }
      
      const { error } = await supabase
        .from("received_items")
        .update(updateData)
        .eq("id", id)

      if (error) {
        console.error("Supabase update error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      await refreshInventory()
    } catch (err: any) {
      console.error("Error updating received item:", err)
      const errorMessage = err?.message || err?.details || err?.hint || JSON.stringify(err) || "Failed to update received item"
      setError(errorMessage)
      
      // If it's a column doesn't exist error, provide helpful message
      if (err?.code === "42703" || err?.message?.includes("column") || err?.message?.includes("does not exist")) {
        setError("Database column 'received_by' does not exist. Please run the migration: ALTER TABLE received_items ADD COLUMN received_by VARCHAR(255);")
      }
    }
  }

  const updateIssuedItem = async (id: string, updates: Partial<IssuedItem>) => {
    setIssuedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("issued_items")
        .update({
          item_type: updates.itemType || undefined,
          toner_model: updates.tonerModel || null,
          toner_color: updates.tonerColor || null,
          toner_type: updates.tonerType || null,
          printer_id: updates.printerId || null,
          printer_name: updates.printerName || null,
          quantity: updates.quantity || undefined,
          issued_to: updates.issuedTo || undefined,
          issued_date: updates.issuedDate || undefined,
          asset_id: updates.assetId || null,
          notes: updates.notes || null,
        })
        .eq("id", id)

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error updating issued item:", err)
      setError(err.message || "Failed to update issued item")
    }
  }

  const deleteReceivedItem = async (id: string) => {
    const item = receivedItems.find((i) => i.id === id)
    
    // If it's a toner, we need to adjust stock
    if (item && item.itemType === "Toner" && item.tonerModel && item.printerId) {
      await updateTonerStock(item.tonerModel as TonerModel, -item.quantity, item.tonerColor, item.printerId)
    }

    setReceivedItems((prev) => prev.filter((item) => item.id !== id))

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("received_items").delete().eq("id", id)

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error deleting received item:", err)
      setError(err.message || "Failed to delete received item")
    }
  }

  const deleteIssuedItem = async (id: string) => {
    const item = issuedItems.find((i) => i.id === id)
    
    // If it's a toner, we need to restore stock (model-only, allows multiple assignments)
    if (item && item.itemType === "Toner" && item.tonerModel) {
      await updateTonerStock(item.tonerModel as TonerModel, item.quantity, item.tonerColor, item.printerId)
    }

    setIssuedItems((prev) => prev.filter((item) => item.id !== id))

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("issued_items").delete().eq("id", id)

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error deleting issued item:", err)
      setError(err.message || "Failed to delete issued item")
    }
  }

  const deleteTonerStock = async (id: string) => {
    setTonerStock((prev) => prev.filter((stock) => stock.id !== id))

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("toner_stock").delete().eq("id", id)

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error deleting toner stock:", err)
      setError(err.message || "Failed to delete toner stock")
    }
  }

  const createTonerStockEntry = async (model: TonerModel, color?: TonerColor, printerId?: string, lowStockThreshold: number = 5) => {
    // Check if stock entry already exists for this model (model must be unique)
    const normalizedModel = typeof model === 'string' ? model.trim() : model
    const existingStock = tonerStock.find((stock) => 
      stock.model.toLowerCase() === normalizedModel.toLowerCase()
    )
    if (existingStock) {
      throw new Error(`Stock entry already exists for toner model: ${model}. Each toner model can only have one stock entry.`)
    }

    const printer = printerId ? devices.find((d) => d.id === printerId) : undefined
    const printerName = printer ? `${printer.assetNumber || printer.serialNumber} - ${printer.assignedTo || "Unassigned"}${printer.modelNumber ? ` (${printer.modelNumber})` : ""}` : undefined

    const newStock: TonerStock = {
      id: Date.now().toString(),
      model: model,
      color,
      printerId,
      printerName,
      currentStock: 0, // Start with 0 quantity
      lowStockThreshold,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    setTonerStock((prev) => [...prev, newStock])

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("toner_stock").insert({
        model: model,
        color: color || null,
        printer_id: printerId || null,
        printer_name: printerName || null,
        current_stock: 0,
        low_stock_threshold: lowStockThreshold,
        last_updated: newStock.lastUpdated,
      })

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error creating toner stock entry:", err)
      setError(err.message || "Failed to create toner stock entry")
      // Revert local state on error
      setTonerStock((prev) => prev.filter((stock) => stock.id !== newStock.id))
      throw err
    }
  }

  const updateTonerStockEntry = async (id: string, updates: Partial<TonerStock>) => {
    const existingStock = tonerStock.find((s) => s.id === id)
    if (!existingStock) return

    // Update local state
    setTonerStock((prev) =>
      prev.map((stock) => (stock.id === id ? { ...stock, ...updates } : stock))
    )

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // If printerId is being updated, get the printer details
      let printerName = existingStock.printerName
      if (updates.printerId !== undefined) {
        const printer = devices.find((d) => d.id === updates.printerId)
        if (printer) {
          printerName = `${printer.assetNumber || printer.serialNumber} - ${printer.assignedTo || "Unassigned"}${printer.modelNumber ? ` (${printer.modelNumber})` : ""}`
        } else {
          printerName = null
        }
      }

      const { error } = await supabase
        .from("toner_stock")
        .update({
          model: updates.model || undefined,
          color: updates.color || null,
          printer_id: updates.printerId || null,
          printer_name: printerName || null,
          current_stock: updates.currentStock !== undefined ? updates.currentStock : undefined,
          low_stock_threshold: updates.lowStockThreshold !== undefined ? updates.lowStockThreshold : undefined,
          last_updated: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)

      if (error) throw error
      await refreshInventory()
    } catch (err: any) {
      console.error("Error updating toner stock entry:", err)
      setError(err.message || "Failed to update toner stock entry")
      // Revert local state on error
      setTonerStock((prev) =>
        prev.map((stock) => (stock.id === id ? existingStock : stock))
      )
    }
  }

  const updateTonerStock = async (model: TonerModel | string, quantityChange: number, color?: TonerColor, printerId?: string) => {
    // Normalize model name for consistent matching
    const normalizedModel = typeof model === 'string' ? model.trim() : model
    
    const existingStock = getTonerStockByModel(normalizedModel, color, printerId)
    const newStock = existingStock
      ? existingStock.currentStock + quantityChange
      : quantityChange > 0
        ? quantityChange
        : 0

    const printer = printerId ? devices.find((d) => d.id === printerId) : undefined

    const updatedStock: TonerStock = {
      id: existingStock?.id || Date.now().toString(),
      model: normalizedModel as TonerModel,
      color,
      printerId,
      printerName: printer ? `${printer.assetNumber || printer.serialNumber} - ${printer.assignedTo || "Unassigned"}${printer.modelNumber ? ` (${printer.modelNumber})` : ""}` : undefined,
      currentStock: Math.max(0, newStock),
      lowStockThreshold: existingStock?.lowStockThreshold || 5,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    // Update existing stock entry (model must be unique)
    setTonerStock((prev) => {
      return prev.map((stock) => 
        stock.model.toLowerCase() === normalizedModel.toLowerCase() ? updatedStock : stock
      )
    })

    if (!isSupabaseConfigured() || isUsingMockData) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // Use upsert to handle both insert and update cases
      // Now with model-only uniqueness
      const { error } = await supabase
        .from("toner_stock")
        .upsert({
          model: normalizedModel,
          color: existingStock?.color || color || null,
          printer_id: existingStock?.printerId || printerId || null,
          printer_name: existingStock?.printerName || updatedStock.printerName || null,
          current_stock: Math.max(0, newStock),
          low_stock_threshold: existingStock?.lowStockThreshold || 5,
          last_updated: updatedStock.lastUpdated,
        }, {
          onConflict: 'model'
        })

      if (error) throw error
      
      // Refresh inventory after successful update
      await refreshInventory()
    } catch (err: any) {
      console.error("Error updating toner stock:", err)
      setError(err.message || "Failed to update toner stock")
    }
  }

  const getTonerStockByModel = (model: TonerModel | string, color?: TonerColor, printerId?: string): TonerStock | undefined => {
    // Find stock by model only (model must be unique, ignore color and printer)
    const normalizedModel = typeof model === 'string' ? model.trim() : model
    return tonerStock.find((stock) => 
      stock.model.toLowerCase() === normalizedModel.toLowerCase()
    )
  }

  const getLowStockToners = (): TonerStock[] => {
    return tonerStock.filter((stock) => stock.currentStock <= stock.lowStockThreshold)
  }

  const getEligibleUsersForItem = (itemType: ItemType): string[] => {
    if (itemType === "Keyboard" || itemType === "Mouse") {
      const eligibleDevices = devices.filter(
        (d) => (d.type === "Computer" || d.type === "Laptop") && d.assignedTo && d.assignedTo !== "Not Assigned"
      )
      return Array.from(new Set(eligibleDevices.map((d) => d.assignedTo)))
    } else if (itemType === "Toner") {
      const eligibleDevices = devices.filter(
        (d) => d.type === "Printer" && d.assignedTo && d.assignedTo !== "Not Assigned"
      )
      return Array.from(new Set(eligibleDevices.map((d) => d.assignedTo)))
    } else if (itemType === "Monitor") {
      const eligibleDevices = devices.filter(
        (d) => d.type === "Computer" && d.assignedTo && d.assignedTo !== "Not Assigned"
      )
      return Array.from(new Set(eligibleDevices.map((d) => d.assignedTo)))
    }

    const allUsers = devices
      .filter((d) => d.assignedTo && d.assignedTo !== "Not Assigned")
      .map((d) => d.assignedTo)
    return Array.from(new Set(allUsers))
  }

  const getPrinters = () => {
    return devices.filter((d) => d.type === "Printer")
  }

  return (
    <InventoryContext.Provider
      value={{
        receivedItems,
        issuedItems,
        tonerStock,
        loading,
        error,
        isUsingMockData,
        addReceivedItem,
        addIssuedItem,
        updateReceivedItem,
        updateIssuedItem,
        deleteReceivedItem,
        deleteIssuedItem,
        deleteTonerStock,
        createTonerStockEntry,
        updateTonerStock,
        updateTonerStockEntry,
        getTonerStockByModel,
        getLowStockToners,
        getEligibleUsersForItem,
        getPrinters,
        refreshInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}

