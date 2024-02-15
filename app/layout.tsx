"use client"

import "@/styles/globals.css"
import {
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  xdefiWallet,
} from "@rainbow-me/rainbowkit/wallets"

import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import Index from "@/app/index"

import { ZetaChainProvider } from "./ZetaChainContext"
import "@rainbow-me/rainbowkit/styles.css"
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit"
import { WagmiConfig, configureChains, createConfig } from "wagmi"
import {
  bscTestnet,
  goerli,
  polygonMumbai,
  zetachainAthensTestnet,
} from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

interface RootLayoutProps {
  children: React.ReactNode
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    goerli,
    polygonMumbai,
    bscTestnet,
    {
      ...zetachainAthensTestnet,
      iconUrl: "https://www.zetachain.com/favicon/favicon.png",
    },
  ],
  [publicProvider()]
)

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId: "PROJECT_ID", chains }),
      xdefiWallet({ chains }),
      okxWallet({ projectId: "PROJECT_ID", chains }),
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export default function RootLayout({ children }: RootLayoutProps) {
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
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <ZetaChainProvider>
                <Index>{children}</Index>
              </ZetaChainProvider>
            </RainbowKitProvider>
          </WagmiConfig>
        </body>
      </html>
    </>
  )
}
