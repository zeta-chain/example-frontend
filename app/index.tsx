"use client"

import "@/styles/globals.css"
import { useCallback, useEffect, useState } from "react"

import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"

import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit"
// @ts-ignore
import { getBalances } from "@zetachain/toolkit/helpers"
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

export default function Index({ children }: RootLayoutProps) {
  const [cctxs, setCCTXs] = useState([])
  const [balances, setBalances] = useState([])
  const [foreignCoins, setForeignCoins] = useState([])
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [balancesRefreshing, setBalancesRefreshing] = useState(false)
  const { address } = useAccount()

  const fetchBalances = useCallback(async (refresh: Boolean = false) => {
    refresh ? setBalancesRefreshing(true) : setBalancesLoading(true)
    try {
      const result = await getBalances(address)
      setBalances(result as any)
    } catch (err) {
      console.log(err)
    }
    refresh ? setBalancesRefreshing(false) : setBalancesLoading(false)
  }, [])

  useEffect(() => {
    fetchBalances()

    const fetchForeignCoins = async () => {
      try {
        const response = await fetch(
          "https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/zetacore/fungible/foreign_coins"
        )
        const data = await response.json()
        setForeignCoins(data.foreignCoins)
      } catch (err) {
        console.error("Error fetching foreign coins:", err)
      }
    }
    fetchForeignCoins()
  }, [])

  return (
    <>
      <AppContext.Provider
        value={{
          cctxs,
          setCCTXs,
          balances,
          setBalances,
          balancesLoading,
          balancesRefreshing,
          fetchBalances,
          foreignCoins,
        }}
      >
        <RainbowKitProvider chains={chains}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <section className="container">{children}</section>
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </AppContext.Provider>
    </>
  )
}
