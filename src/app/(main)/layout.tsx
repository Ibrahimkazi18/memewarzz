import type React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { RightPanel } from "@/components/right-panel"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import Link from "next/link"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh overflow-x-hidden">
        {" "}
        {/* Main flex container for 3 columns */}
        <AppSidebar /> {/* Left Sidebar - fixed width on desktop */}

        <div className="flex flex-1 flex-col w-full">
          {" "}
          {/* Flexible container for Header + Main Content + Right Panel */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 md:hidden" /> {/* Only show trigger on mobile */}
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">Home</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-xl font-semibold ml-auto md:ml-0">Memwarzz</h1>
          </header>
          <div className="flex flex-1">
            {" "}
            {/* Flexible container for Main Content + Right Panel */}
            <main className="flex-1 lg:min-w-[900px] xl:min-w-[950px] p-4 overflow-hidden">{children}</main>
            <RightPanel /> {/* Right Panel - fixed width on desktop */}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
