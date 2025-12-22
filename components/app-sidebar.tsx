"use client"

import { Home, List, FileBarChart, Plus, BarChart, Package, PackageCheck, Printer, Monitor, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDevices } from "@/context/device-context"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Devices",
    url: "/devices",
    icon: List,
  },
]

const itemMenuItems = [
  {
    title: "Receive Items",
    url: "/receive",
    icon: Package,
  },
  {
    title: "Issue Items",
    url: "/issue",
    icon: PackageCheck,
  },
  {
    title: "Toner Stock",
    url: "/toner-stock",
    icon: Printer,
  },
]

const reportMenuItems = [
  {
    title: "Device Inventory",
    url: "/reports/devices",
    icon: Monitor,
  },
  {
    title: "Received Items",
    url: "/reports/received",
    icon: Package,
  },
  {
    title: "Issued Items",
    url: "/reports/issued",
    icon: PackageCheck,
  },
  {
    title: "Toner Stock",
    url: "/reports/toner-stock",
    icon: Printer,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { getDeviceCount } = useDevices()
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith("/reports"))

  // Helper function to check if a menu item is active
  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/" || pathname === ""
    }
    return pathname.startsWith(url)
  }

  // Check if any report item is active
  const isReportsActive = pathname.startsWith("/reports")

  return (
    <Sidebar className="bg-gradient-to-b from-white to-blue-50 shadow-xl rounded-r-3xl min-w-[200px] max-w-[240px] font-inter">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold font-inter">HI</div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-bold text-lg font-inter">Hesu Investment Limited</span>
            <span className="truncate text-xs text-muted-foreground font-inter">{getDeviceCount()} Devices Registered</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-inter">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-0.5">
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all text-base font-medium font-inter ${isActive(item.url) ? 'bg-blue-100 text-blue-800 shadow' : 'hover:bg-blue-50 text-gray-700'}`}>
                      <item.icon className={`h-7 w-7 ${isActive(item.url) ? 'text-blue-700' : 'text-gray-400'}`} />
                      <span>{item.title}</span>
                      {isActive(item.url) && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Add Device after Devices */}
              <SidebarMenuItem className="mb-0.5">
                <SidebarMenuButton asChild isActive={pathname === "/devices/add"}>
                  <Link href="/devices/add" className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all text-base font-medium font-inter ${pathname === "/devices/add" ? 'bg-blue-100 text-blue-800 shadow' : 'hover:bg-blue-50 text-gray-700'}`}>
                    <Plus className={`h-7 w-7 ${pathname === "/devices/add" ? 'text-blue-700' : 'text-gray-400'}`} />
                    <span>Add Device</span>
                    {pathname === "/devices/add" && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-inter text-center">Items</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {itemMenuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-0.5">
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all text-base font-medium font-inter ${isActive(item.url) ? 'bg-blue-100 text-blue-800 shadow' : 'hover:bg-blue-50 text-gray-700'}`}>
                      <item.icon className={`h-7 w-7 ${isActive(item.url) ? 'text-blue-700' : 'text-gray-400'}`} />
                      <span>{item.title}</span>
                      {isActive(item.url) && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-inter">Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem className="mb-0.5">
                <SidebarMenuButton
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all text-base font-medium font-inter w-full ${isReportsActive ? 'bg-blue-100 text-blue-800 shadow' : 'hover:bg-blue-50 text-gray-700'}`}
                >
                  <FileBarChart className={`h-7 w-7 ${isReportsActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span>Reports</span>
                  {reportsOpen ? (
                    <ChevronDown className={`ml-auto h-5 w-5 ${isReportsActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  ) : (
                    <ChevronRight className={`ml-auto h-5 w-5 ${isReportsActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {reportsOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {reportMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="mb-0.5">
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link href={item.url} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium font-inter ${isActive(item.url) ? 'bg-blue-100 text-blue-800 shadow' : 'hover:bg-blue-50 text-gray-700'}`}>
                          <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-blue-700' : 'text-gray-400'}`} />
                          <span>{item.title}</span>
                          {isActive(item.url) && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Hide SidebarRail on desktop for a cleaner look */}
    </Sidebar>
  )
}
