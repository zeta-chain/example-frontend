"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { BalanceProvider } from "@/context/BalanceContext"
import { CCTXsProvider } from "@/context/CCTXsContext"
import { FeesProvider } from "@/context/FeesContext"
import { PricesProvider } from "@/context/PricesContext"
import { StakingProvider } from "@/context/StakingContext"
import { ValidatorsProvider } from "@/context/ValidatorsContext"
// @ts-ignore
import Cookies from "js-cookie"

import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { SiteHeader } from "@/components/Header"

import { NFTProvider } from "./nft/useNFT"

interface RootLayoutProps {
  children: React.ReactNode
}

export default function Index({ children }: RootLayoutProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (!Cookies.get("firstTimeVisit")) {
      toast({
        title: "Welcome to ZetaChain Example App",
        description: "This is a testnet. Please do not use real funds.",
        duration: 60000,
      })
      Cookies.set("firstTimeVisit", "true", { expires: 7 })
    }
  }, [])

  return (
    <BalanceProvider>
      <FeesProvider>
        <ValidatorsProvider>
          <StakingProvider>
            <PricesProvider>
              <CCTXsProvider>
                <NFTProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader />
                    <section className="container px-4 mt-4">
                      {children}
                    </section>
                  </div>
                  <Toaster />
                </NFTProvider>
              </CCTXsProvider>
            </PricesProvider>
          </StakingProvider>
        </ValidatorsProvider>
      </FeesProvider>
    </BalanceProvider>
  )
}
