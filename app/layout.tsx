"use client"

import "@/styles/globals.css"
import { useState } from "react"

import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit"
import { WagmiConfig, configureChains, createConfig, useAccount } from "wagmi"
import {
  bscTestnet,
  goerli,
  polygonMumbai,
  zetachainAthensTestnet,
} from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

import AppContext from "@/app/app"

interface RootLayoutProps {
  children: React.ReactNode
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    goerli,
    polygonMumbai,
    {
      ...zetachainAthensTestnet,
      iconUrl: "https://www.zetachain.com/favicon/favicon.png",
    },
    bscTestnet,
  ],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: "RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export default function RootLayout({ children }: RootLayoutProps) {
  const [cctxs, setCCTXs] = useState([])

  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <AppContext.Provider value={{ cctxs, setCCTXs }}>
            <WagmiConfig config={wagmiConfig}>
              <RainbowKitProvider chains={chains}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                >
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader />
                    <section className="container">{children}</section>
                  </div>
                </ThemeProvider>
              </RainbowKitProvider>
            </WagmiConfig>
          </AppContext.Provider>
        </body>
      </html>
    </>
  )
}
