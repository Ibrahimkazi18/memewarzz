'use client'

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { WalletContextProvider } from "@/components/wallet-provider"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + "overflow-hidden"}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster />
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
