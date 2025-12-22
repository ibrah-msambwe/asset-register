import type React from "react"
import { DeviceProvider } from "@/context/device-context"
import { InventoryProvider } from "@/context/inventory-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DeviceProvider>
      <InventoryProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-white">
            <AppSidebar />
            <div className="flex-1 overflow-auto bg-white">{children}</div>
          </div>
          <Toaster />
        </SidebarProvider>
      </InventoryProvider>
    </DeviceProvider>
  )
}
