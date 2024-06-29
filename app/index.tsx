"use client"

import { AppProvider } from "@/context/AppContext"

import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"

import { NFTProvider } from "./nft/useNFT"

interface RootLayoutProps {
  children: React.ReactNode
}

export default function Index({ children }: RootLayoutProps) {
  return (
    <AppProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <NFTProvider>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <section className="container px-4 mt-4">{children}</section>
          </div>
          <Toaster />
        </NFTProvider>
      </ThemeProvider>
    </AppProvider>
  )
}
